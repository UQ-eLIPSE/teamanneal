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

// Destructor
ConstraintCost::~ConstraintCost()
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
	target(((const CountConstraint*)constraint)->get_target()),
	constraintNumber(constraint->get_constraint_number()),
	numMembersConsidered(0),
	count(0),
	numMembersPendingMove(0),
	countPendingMove(0)
{
    // Make sure the constraint is a count constraint
    assert(constraint->is_count_constraint());

    this->initialise();
}

// Destructor
CountConstraintCost::~CountConstraintCost()
{
}

// Count how many team members meet the constraint
void CountConstraintCost::initialise()
{
    // Iterate over each member of the team and count how many satisfy the condition
    countPendingMove = 0;
    numMembersPendingMove = 0;
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	if(memberItr->is_condition_met(constraintNumber)) {
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

double CountConstraintCost::pend_remove_member(Member* member)
{
    // We assume, but do not check that the member is part of the team
    double costBefore = costPendingMove;
    --numMembersPendingMove;
    if(member->is_condition_met(constraintNumber)) {
	--countPendingMove;
    }
    evaluate();
    return (costPendingMove - costBefore);
}

double CountConstraintCost::pend_add_member(Member* member)
{
    // We assume, but do not check that the member is not part of the team
    double costBefore = costPendingMove;
    ++numMembersPendingMove;
    if(member->is_condition_met(constraintNumber)) {
	++countPendingMove;
    }
    evaluate();
    return (costPendingMove - costBefore);
}

double CountConstraintCost::percent_constraint_met()
{
    assert(costPendingMove == cost);
    if(!constraint->applies_to_team_size(team->size())) {
	return 100.0;	// constraints are assumed to be met if they do not apply to this team size
    }
    switch(constraint->get_type()) {
	case Constraint::COUNT_EXACT:
	case Constraint::COUNT_NOT_EXACT:
	case Constraint::COUNT_AT_LEAST:
	case Constraint::COUNT_AT_MOST:
	    if(cost == 0.0) {
		return 100.0;
	    } else {
		return 0;
	    }
	    break;
	case Constraint::COUNT_MAXIMISE:
	    if(numMembersConsidered > 0) {
		return (100.0*(double)count/(double)numMembersConsidered);
	    } else {
		return 100.0;
	    }
	    break;
	case Constraint::COUNT_MINIMISE:
	    if(numMembersConsidered > 0) {
		return 100.0 - (100.0*(double)count/(double)numMembersConsidered);
	    } else {
		return 100.0;
	    }
	    break;
	default:
	    // Shouldn't happen
	    assert(false);
    }
}

///////////////////////////////////////////////////////////////////////////////
// SimilarityConstraintCost

// Constructor
SimilarityConstraintCost::SimilarityConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	ConstraintCost(team, constraint),
	attribute(constraint->get_attribute()),
	numAttributeValues(constraint->get_attribute()->num_values()),
	countDistinctValues(0),
	numMembersConsidered(0),
	countDistinctValuesPendingMove(0),
	numMembersPendingMove(0)
{
    assert(attribute->is_string());

    this->initialise();
}

// Destructor
SimilarityConstraintCost::~SimilarityConstraintCost()
{
}

void SimilarityConstraintCost::initialise()
{
    // This initialiser updates both the committed and pending values - it's easier that way
    // Clear the map of values to counts
    valueCount.clear();
    valueCountPendingMove.clear();
    // Create an entry for each possible attribute value and initialise the count to 0 for each
    valueCount.resize(numAttributeValues, 0);
    valueCountPendingMove.resize(numAttributeValues, 0);
    countDistinctValuesPendingMove = 0;
    numMembersPendingMove = 0;

    // Iterate over each member of the team and work out how many different values there are
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	int attributeValueIndex = memberItr->get_attribute_value_index(attribute);
	++valueCount[attributeValueIndex];
	++valueCountPendingMove[attributeValueIndex];
	if(valueCount[attributeValueIndex] == 1) {
	    ++countDistinctValuesPendingMove;
	}
	++numMembersPendingMove;

	// Move on to next member
	++memberItr;
    }
    valueCountsToUpdate.clear();
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
    for(int i=0; i< valueCountsToUpdate.size(); ++i) {
	valueCount[i] = valueCountPendingMove[i];
    }
    valueCountsToUpdate.clear();
}

void SimilarityConstraintCost::undo_pending()
{
    ConstraintCost::undo_pending();

    countDistinctValuesPendingMove = countDistinctValues;
    numMembersPendingMove = numMembersConsidered;
    for(int i=0; i< valueCountsToUpdate.size(); ++i) {
	valueCountPendingMove[i] = valueCount[i];
    }
    valueCountsToUpdate.clear();
}

double SimilarityConstraintCost::pend_remove_member(Member* member)
{
    // We assume, but do not check that the member is part of the team
    double costBefore = costPendingMove;
    --numMembersPendingMove;

    int attributeValueIndex = member->get_attribute_value_index(attribute);
    assert(valueCountPendingMove[attributeValueIndex] > 0);
    --valueCountPendingMove[attributeValueIndex];
    valueCountsToUpdate.push_back(attributeValueIndex);	// add this index to our list of indices to 
    							// update if we commit this change
    if(valueCountPendingMove[attributeValueIndex] == 0) {
	// One fewer distinct value now
	assert(countDistinctValuesPendingMove > 0);
	--countDistinctValuesPendingMove;
    }
    evaluate();
    return (costPendingMove - costBefore);
}

double SimilarityConstraintCost::pend_add_member(Member* member)
{
    // We assume, but do not check that the member is not part of the team
    double costBefore = costPendingMove;
    ++numMembersPendingMove;

    int attributeValueIndex = member->get_attribute_value_index(attribute);
    ++valueCountPendingMove[attributeValueIndex];
    valueCountsToUpdate.push_back(attributeValueIndex);	// add this index to our list of indices to 
    							// update if we commit this change
    if(valueCountPendingMove[attributeValueIndex] == 1) {
	// One more distinct value now
	++countDistinctValuesPendingMove;
    }
    evaluate();
    return (costPendingMove - costBefore);
}

double SimilarityConstraintCost::percent_constraint_met()
{
    assert(costPendingMove == cost);
    if(!constraint->applies_to_team_size(team->size())) {
	return 100.0;	// constraints are assumed to be met if they do not apply to this team size
    } else if(cost == 0.0) {
	return 100.0; 	// constraint satisfied
    } else {
	return 0.0;
    }
    return (costPendingMove == 0.0);
}

///////////////////////////////////////////////////////////////////////////////
// RangeConstraintCost

// Constructor
RangeConstraintCost::RangeConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	ConstraintCost(team, constraint),
	attribute(constraint->get_attribute()),
	attributeValueRange(0.0),
	/*
	minValue(INFINITY),
	maxValue(-INFINITY),
	*/
	sumOfValues(0.0),
	sumOfSquareValues(0.0),
	numMembersConsidered(0),
	/*
	minValuePendingMove(INFINITY),
	maxValuePendingMove(-INFINITY),
	*/
	sumOfValuesPendingMove(0.0),
	sumOfSquareValuesPendingMove(0.0),
	numMembersPendingMove(0)
{
    assert(attribute->is_numeric());
    if(attribute->num_values() > 0) {
	attributeValueRange = attribute->get_numerical_max_value() - 
		attribute->get_numerical_min_value();
    }

    this->initialise();
}

// Destructor
RangeConstraintCost::~RangeConstraintCost()
{
}

void RangeConstraintCost::initialise()
{

    // Reset measures
    /*
    minValuePendingMove = INFINITY;
    maxValuePendingMove = -INFINITY;
    */
    sumOfValuesPendingMove = 0.0;
    sumOfSquareValuesPendingMove = 0.0;
    numMembersPendingMove = 0;

    // Iterate over each member of the team and work out how many different values there are
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	double value = memberItr->get_numeric_attribute_value(attribute);
	sumOfValuesPendingMove += value;
	sumOfSquareValuesPendingMove += (value * value);
	/*
	if(value < minValuePendingMove) {
	    minValuePendingMove = value;
	}
	if(value > maxValuePendingMove) {
	    maxValuePendingMove = value;
	}
	*/

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

    /*
    minValue = minValuePendingMove;
    maxValue = maxValuePendingMove;
    */
    sumOfValues = sumOfValuesPendingMove;
    sumOfSquareValues = sumOfSquareValuesPendingMove;
    numMembersConsidered = numMembersPendingMove;
}

void RangeConstraintCost::undo_pending()
{
    ConstraintCost::undo_pending();

    /*
    minValuePendingMove = minValue;
    maxValuePendingMove = maxValue;
    */
    sumOfValuesPendingMove = sumOfValues;
    sumOfSquareValuesPendingMove = sumOfSquareValues;
    numMembersPendingMove = numMembersConsidered;
}

double RangeConstraintCost::pend_remove_member(Member* member)
{
    // We assume, but do not check that the member is part of the team
    double costBefore = costPendingMove;
    --numMembersPendingMove;

    double value = member->get_numeric_attribute_value(attribute);
    sumOfValuesPendingMove -= value;
    sumOfSquareValuesPendingMove -= (value * value);

    evaluate();
    return (costPendingMove - costBefore);
}

double RangeConstraintCost::pend_add_member(Member* member)
{
    // We assume, but do not check that the member is not part of the team
    double costBefore = costPendingMove;
    ++numMembersPendingMove;

    double value = member->get_numeric_attribute_value(attribute);
    sumOfValuesPendingMove += value;
    sumOfSquareValuesPendingMove += (value * value);

    evaluate();
    return (costPendingMove - costBefore);
}

double RangeConstraintCost::percent_constraint_met()
{
    if(!constraint->applies_to_team_size(team->size())) {
	return 100.0;	// constraints are assumed to be met if they do not apply to this team size
    } else if(constraint->get_type() == Constraint::HOMOGENEOUS) {
	if(attributeValueRange == 0.0) {
	    return 100.0; // constraint met
	} else if ((std_dev() / attributeValueRange) < 0.1) {
	    return 100.0;	// we'll consider the constraint met
	} else {
	    return 0.0;
	}
    } else { // Constraint::HETEROGENEOUS:
	if(attributeValueRange == 0.0) {
	    return 0.0;
	} else if ((std_dev() / attributeValueRange) > 0.25) {
	    // consider constraint met
	    return 100.0;
	} else {
	    return 0.0;
	}
    }
}

double RangeConstraintCost::std_dev()
{
    assert(numMembersPendingMove > 0);
    double num = numMembersPendingMove;
    double delta = num * sumOfSquareValuesPendingMove - sumOfValuesPendingMove * sumOfValuesPendingMove;
    if(delta > 0.0) {
	return sqrt(delta) / num;
    } else {
	return 0;
    }
}

#if 0
double RangeConstraintCost::range()
{
    assert(numMembersPendingMove > 0);
    return (maxValuePendingMove - minValuePendingMove);
}
#endif
