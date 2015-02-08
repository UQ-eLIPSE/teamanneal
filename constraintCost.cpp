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
	constraint(constraint)
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

///////////////////////////////////////////////////////////////////////////////
// CountConstraintCost

// Constructor
CountConstraintCost::CountConstraintCost(const TeamLevel* team, const Constraint* constraint) :
	ConstraintCost(team, constraint),
	numMembersConsidered(0),
	count(0),
	target(0)
{
    // Make sure the constraint is a count constraint
    assert(constraint->is_count_constraint());
    const CountConstraint* countConstraint = (const CountConstraint*)constraint;
    target = countConstraint->get_target();

    this->do_count();
    this->evaluate();
}

// Count how many team members meet the constraint
void CountConstraintCost::do_count()
{
    // Iterate over each member of the team and count how many satisfy the condition
    int constraintNum = constraint->get_constraint_number();
    count = 0;
    numMembersConsidered = 0;
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	if(memberItr->is_condition_met(constraintNum)) {
	    count++;
	}
	++memberItr;
	++numMembersConsidered;
    }
}

// Based on the count, work out the cost
void CountConstraintCost::evaluate()
{
    switch(constraint->get_type()) {
	case Constraint::COUNT_EXACT:
	    if(count == target) {
		cost = 0.0;
	    } else {
		cost = constraint->get_weight();
	    } 
	    break;
	case Constraint::COUNT_NOT_EXACT:
	    if(count != target) {
		cost = 0.0;
	    } else {
		cost = constraint->get_weight();
	    }
	    break;
	case Constraint::COUNT_AT_LEAST:
	    if(count >= target) {
		cost = 0.0;
	    } else {
		cost = constraint->get_weight();
	    }
	    break;
	case Constraint::COUNT_AT_MOST:
	    if(count <= target) {
		cost = 0.0;
	    } else {
		cost = constraint->get_weight();
	    }
	    break;
	case Constraint::COUNT_MAXIMISE:
	    cost = (numMembersConsidered - count) * constraint->get_weight();
	    break;
	case Constraint::COUNT_MINIMISE:
	    cost = count * constraint->get_weight();
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
	countDistinctValues(0),
	numMembersConsidered(0),
	numAttributeValues(constraint->get_attribute()->num_values())
{
    assert(constraint->get_attribute()->is_string());

    this->do_count();
    this->evaluate();
}

void SimilarityConstraintCost::do_count()
{
    const Attribute* attribute = constraint->get_attribute();

    // Clear the map of values to counts
    valueCount.clear();
    // Create an entry for each possible attribute value and initialise the count to 0 for each
    valueCount.resize(attribute->num_values(), 0);
    countDistinctValues = 0;
    numMembersConsidered = 0;

    // Iterate over each member of the team and work out how many different values there are
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	int attributeValueIndex = memberItr->get_attribute_value_index(attribute);
	++valueCount[attributeValueIndex];
	if(valueCount[attributeValueIndex] == 1) {
	    ++countDistinctValues;
	}
	++numMembersConsidered;

	// Move on to next member
	++memberItr;
    }
}

void SimilarityConstraintCost::evaluate()
{
    int maxPossibleValues;

    switch(constraint->get_type()) {
	case Constraint::HOMOGENEOUS:
	    if(countDistinctValues <= 1) {
		cost = 0.0;
	    } else {
		cost = (countDistinctValues - 1) * constraint->get_weight();
	    }
	    break;
	case Constraint::HETEROGENEOUS:
	    maxPossibleValues = min(numMembersConsidered, numAttributeValues);
	    cost = (maxPossibleValues - countDistinctValues) * constraint->get_weight();
	    break;
	default:
	    assert(false);	// Should not happen
	    break;
    }
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
	attributeValueRange(0.0)
{
    const Attribute* attr = constraint->get_attribute();
    assert(attr->is_numeric());
    if(attr->num_values() > 0) {
	attributeValueRange = attr->get_numerical_max_value() - attr->get_numerical_min_value();
    }

    this->do_count();
    this->evaluate();
}

void RangeConstraintCost::do_count()
{
    const Attribute* attribute = constraint->get_attribute();

    // Reset measures
    minValue = INFINITY;
    maxValue = -INFINITY;
    sumOfValues = 0.0;
    sumOfSquareValues = 0.0;
    numMembersConsidered = 0;

    // Iterate over each member of the team and work out how many different values there are
    MemberIterator memberItr(team);
    while(!memberItr.done()) {
	double value = memberItr->get_numeric_attribute_value(attribute);
	sumOfValues += value;
	sumOfSquareValues += (value * value);
	if(value < minValue) {
	    minValue = value;
	}
	if(value > maxValue) {
	    maxValue = value;
	}

	++numMembersConsidered;

	// Move on to next member
	++memberItr;
    }
}

void RangeConstraintCost::evaluate()
{
    switch(constraint->get_type()) {
	case Constraint::HOMOGENEOUS:
	    if(numMembersConsidered > 0 && attributeValueRange > 0.0) {
		cost = constraint->get_weight() * 2.0 * std_dev() / attributeValueRange;
	    } else {
		cost = 0.0;
	    }
	    break;
	case Constraint::HETEROGENEOUS:
	    if(numMembersConsidered > 0 && attributeValueRange > 0.0) {
		cost = constraint->get_weight() * (attributeValueRange - 2.0 * std_dev()) / attributeValueRange;
	    } else {
		cost = 0.0;
	    }
	    break;
	default:
	    assert(false);	// Should not happen
	    break;
    }
}

double RangeConstraintCost::std_dev()
{
    assert(numMembersConsidered > 0);
    double num = numMembersConsidered;
    return sqrt(num * sumOfSquareValues - sumOfValues * sumOfValues) / num;
}

double RangeConstraintCost::range()
{
    assert(numMembersConsidered > 0);
    return (maxValue - minValue);
}
