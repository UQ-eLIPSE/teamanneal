//
// constraintCost.cpp
//

#include "constraintCost.hh"
#include "teamData.hh"
#include "assert.h"
#include <cmath>

///////////////////////////////////////////////////////////////////////////////
// ConstraintCost

// Constructor
ConstraintCost::ConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	team(team),
	constraint(constraint),
	cost(0.0),
	costPendingMove(0.0),
	teamSizePendingMove(team->size())
{
}

double ConstraintCost::get_cost()
{
    if(constraint->applies_to_team_size(team->size())) {
	return cost;
    } else {
	return 0.0;
    }
}

double ConstraintCost::get_pending_cost()
{
    if(constraint->applies_to_team_size(teamSizePendingMove)) {
	return costPendingMove;
    } else {
	return 0.0;
    }
}

double ConstraintCost::delta_cost()
{
    return get_pending_cost() - get_cost();
}

const TeamLevel* ConstraintCost::get_team() const
{
    return team;
}

const Constraint* ConstraintCost::get_constraint() const
{
    return constraint;
}

ConstraintCost* ConstraintCost::construct(const TeamLevel* team, const Constraint* constraint)
{
    if(constraint->is_count_constraint()) {
	// Count constraint
	return new CountConstraintCost(team, constraint);
    } else if (constraint->applies_to_string_field()) {
	// Must be a similarity constraint
	return new SimilarityConstraintCost(team, constraint);
    } else {
	// Must be a numeric range constraint
	return new RangeConstraintCost(team, constraint);
    }
}

void ConstraintCost::commit_pending() 
{
    cost = costPendingMove;
    assert(teamSizePendingMove = team->size());		// team size should already have been changed
}

void ConstraintCost::undo_pending() 
{
    costPendingMove = cost;
    teamSizePendingMove = team->size();
}

///////////////////////////////////////////////////////////////////////////////
// CountConstraintCost

// Constructor
CountConstraintCost::CountConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	ConstraintCost(team, constraint),
	numMembersConsidered(0),
	count(0),
	target(0),
	numMembersPendingMove(0),
	countPendingMove(0)
{
    // Make sure the constraint is a count constraint
    assert(constraint->is_count_constraint());
    const CountConstraint* countConstraint = (const CountConstraint*)constraint;
    target = countConstraint->get_target();

    this->initialise();
}

// Count how many team members meet the constraint
void CountConstraintCost::initialise()
{
    // Iterate over each member of the team and count how many satisfy the condition
    int constraintNum = constraint->get_constraint_number();
    countPendingMove = 0;
    numMembersPendingMove = 0;
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	if(memberItr->is_condition_met(constraintNum)) {
	    countPendingMove++;
	}
	++memberItr;
	++numMembersPendingMove;
    }
    // We've saved these as pending changes - commit them
    evaluate();
    commit_pending();
}

// Based on the count, work out the new cost
void CountConstraintCost::evaluate()
{
    switch(constraint->get_type()) {
	case Constraint::COUNT_EXACT:
	    if(countPendingMove == target) {
		costPendingMove = 0.0;
	    } else {
		costPendingMove = constraint->get_weight();
	    } 
	    break;
	case Constraint::COUNT_NOT_EXACT:
	    if(countPendingMove != target) {
		costPendingMove = 0.0;
	    } else {
		costPendingMove = constraint->get_weight();
	    }
	    break;
	case Constraint::COUNT_AT_LEAST:
	    if(countPendingMove >= target) {
		costPendingMove = 0.0;
	    } else {
		costPendingMove = constraint->get_weight();
	    }
	    break;
	case Constraint::COUNT_AT_MOST:
	    if(countPendingMove <= target) {
		costPendingMove = 0.0;
	    } else {
		costPendingMove = constraint->get_weight();
	    }
	    break;
	case Constraint::COUNT_MAXIMISE:
	    costPendingMove = (numMembersPendingMove - countPendingMove) * constraint->get_weight();
	    break;
	case Constraint::COUNT_MINIMISE:
	    costPendingMove = countPendingMove * constraint->get_weight();
	    break;
	default:
	    // Shouldn't happen
	    assert(false);
    }
}

void CountConstraintCost::commit_pending()
{
    ConstraintCost::commit_pending();

    count = countPendingMove;
    numMembersConsidered = numMembersPendingMove;
}

void CountConstraintCost::undo_pending()
{
    ConstraintCost::undo_pending();

    countPendingMove = count;
    numMembersPendingMove = numMembersConsidered;
}

///////////////////////////////////////////////////////////////////////////////
// SimilarityConstraintCost

// Constructor
SimilarityConstraintCost::SimilarityConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	ConstraintCost(team, constraint),
	countDistinctValues(0),
	numMembersConsidered(0),
	numAttributeValues(constraint->get_attribute()->num_values()),
	countDistinctValuesPendingMove(0),
	numMembersPendingMove(0)
{
    assert(constraint->get_attribute()->is_string());

    this->initialise();
}

void SimilarityConstraintCost::initialise()
{
    const Attribute* attribute = constraint->get_attribute();

    // Clear the map of values to counts
    valueCount.clear();
    // Create an entry for each possible attribute value and initialise the count to 0 for each
    valueCount.resize(attribute->num_values(), 0);
    countDistinctValuesPendingMove = 0;
    numMembersPendingMove = 0;

    // Iterate over each member of the team and work out how many different values there are
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	int attributeValueIndex = memberItr->get_attribute_value_index(attribute);
	++valueCount[attributeValueIndex];
	if(valueCount[attributeValueIndex] == 1) {
	    ++countDistinctValuesPendingMove;
	}
	++numMembersPendingMove;

	// Move on to next member
	++memberItr;
    }
    valueCountsToIncrementPendingMove.clear();
    valueCountsToDecrementPendingMove.clear();
    this->evaluate();
    this->commit_pending();
}

void SimilarityConstraintCost::evaluate()
{
    int maxPossibleValues;

    switch(constraint->get_type()) {
	case Constraint::HOMOGENEOUS:
	    if(countDistinctValuesPendingMove <= 1) {
		costPendingMove = 0.0;
	    } else {
		costPendingMove = (countDistinctValuesPendingMove - 1) * constraint->get_weight();
	    }
	    break;
	case Constraint::HETEROGENEOUS:
	    maxPossibleValues = min(numMembersPendingMove, numAttributeValues);
	    costPendingMove = (maxPossibleValues - countDistinctValuesPendingMove) * constraint->get_weight();
	    break;
	default:
	    assert(false);	// Should not happen
	    break;
    }
}

void SimilarityConstraintCost::commit_pending()
{
    ConstraintCost::commit_pending();

    countDistinctValues = countDistinctValuesPendingMove;
    numMembersConsidered = numMembersPendingMove;
    for(int i=0; i< valueCountsToIncrementPendingMove.size(); ++i) {
	int index = valueCountsToIncrementPendingMove[i];
	++valueCount[index];
    }
    for(int i=0; i< valueCountsToDecrementPendingMove.size(); ++i) {
	int index = valueCountsToDecrementPendingMove[i];
	--valueCount[index];
    }
}

void SimilarityConstraintCost::undo_pending()
{
    ConstraintCost::undo_pending();

    countDistinctValuesPendingMove = countDistinctValues;
    numMembersPendingMove = numMembersConsidered;
    valueCountsToIncrementPendingMove.clear();
    valueCountsToDecrementPendingMove.clear();
}

///////////////////////////////////////////////////////////////////////////////
// RangeConstraintCost

// Constructor
RangeConstraintCost::RangeConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	ConstraintCost(team, constraint),
	minValue(INFINITY),
	maxValue(-INFINITY),
	sumOfValues(0.0),
	sumOfSquareValues(0.0),
	numMembersConsidered(0),
	attributeValueRange(0.0),
	minValuePendingMove(INFINITY),
	maxValuePendingMove(-INFINITY),
	sumOfValuesPendingMove(0.0),
	sumOfSquareValuesPendingMove(0.0),
	numMembersPendingMove(0)
{
    const Attribute* attr = constraint->get_attribute();
    assert(attr->is_numeric());
    if(attr->num_values() > 0) {
	attributeValueRange = attr->get_numerical_max_value() - attr->get_numerical_min_value();
    }

    this->initialise();
}

void RangeConstraintCost::initialise()
{
    const Attribute* attribute = constraint->get_attribute();

    // Reset measures
    minValuePendingMove = INFINITY;
    maxValuePendingMove = -INFINITY;
    sumOfValuesPendingMove = 0.0;
    sumOfSquareValuesPendingMove = 0.0;
    numMembersPendingMove = 0;

    // Iterate over each member of the team and work out how many different values there are
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	double value = memberItr->get_numeric_attribute_value(attribute);
	sumOfValuesPendingMove += value;
	sumOfSquareValuesPendingMove += (value * value);
	if(value < minValuePendingMove) {
	    minValuePendingMove = value;
	}
	if(value > maxValuePendingMove) {
	    maxValuePendingMove = value;
	}

	++numMembersPendingMove;

	// Move on to next member
	++memberItr;
    }
    this->evaluate();
    this->commit_pending();
}

void RangeConstraintCost::evaluate()
{
    switch(constraint->get_type()) {
	case Constraint::HOMOGENEOUS:
	    if(numMembersPendingMove > 0 && attributeValueRange > 0.0) {
		costPendingMove  = constraint->get_weight() * 2.0 * std_dev() / attributeValueRange;
	    } else {
		costPendingMove  = 0.0;
	    }
	    break;
	case Constraint::HETEROGENEOUS:
	    if(numMembersConsidered > 0 && attributeValueRange > 0.0) {
		costPendingMove  = constraint->get_weight() * 
			(attributeValueRange - 2.0 * std_dev()) / attributeValueRange;
	    } else {
		costPendingMove  = 0.0;
	    }
	    break;
	default:
	    assert(false);	// Should not happen
	    break;
    }
}

void RangeConstraintCost::commit_pending()
{
    ConstraintCost::commit_pending();

    minValue = minValuePendingMove;
    maxValue = maxValuePendingMove;
    sumOfValues = sumOfValuesPendingMove;
    sumOfSquareValues = sumOfSquareValuesPendingMove;
    numMembersConsidered = numMembersPendingMove;
}

void RangeConstraintCost::undo_pending()
{
    ConstraintCost::undo_pending();

    minValuePendingMove = minValue;
    maxValuePendingMove = maxValue;
    sumOfValuesPendingMove = sumOfValues;
    sumOfSquareValuesPendingMove = sumOfSquareValues;
    numMembersPendingMove = numMembersConsidered;
}

double RangeConstraintCost::std_dev()
{
    assert(numMembersPendingMove > 0);
    double num = numMembersPendingMove;
    return sqrt(num * sumOfSquareValuesPendingMove - 
	    sumOfValuesPendingMove * sumOfValuesPendingMove) / num;
}

double RangeConstraintCost::range()
{
    assert(numMembersPendingMove > 0);
    return (maxValuePendingMove - minValuePendingMove);
}
