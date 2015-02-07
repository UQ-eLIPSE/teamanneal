/*
 * constraint.cpp
 */

#include "constraint.hh"
#include <assert.h>

////////////////////// Constraint ///////////////////////////////////////////////

Constraint::Constraint(Constraint::Type type, const Attribute* attr, int level, double weight) : 
	type(type),
        attribute(attr),
	level(level),
	applicableTeamSize(0),
	weight(weight) 
{
}

Constraint::Type Constraint::get_type() const
{
    return type;
}

bool Constraint::is_count_constraint() const
{
    return (type < HOMOGENEOUS);
}

void Constraint::set_applicable_team_size(int teamSize) 
{
    applicableTeamSize = teamSize;
}

bool Constraint::applies_to_team_size(int teamSize) const
{
    return (applicableTeamSize == 0 || teamSize == applicableTeamSize);
}

const Attribute* Constraint::get_attribute() const
{
    return attribute;
}

double Constraint::get_weight() const
{
    return weight;
}

////////////////////// CountConstraint //////////////////////////////////////////

CountConstraint::CountConstraint(Constraint::Type type,
	    const Attribute* attr, 
	    Operation operation, 
	    int level, 
	    double weight) :
	Constraint(type, attr, level, weight),
	targetCount(0),
	operation(operation)
{
    assert(type != HOMOGENEOUS && type != HETEROGENEOUS);
}

void CountConstraint::set_target(int target)
{
    assert(type == COUNT_EXACT || type == COUNT_NOT_EXACT || 
	    type == COUNT_AT_LEAST || type == COUNT_AT_MOST);
    targetCount = target;
}

////////////////////// CountStringConstraint ////////////////////////////////////

CountStringConstraint::CountStringConstraint(Constraint::Type type,
	    const Attribute* attr, 
	    Operation operation, 
	    const string& comparisonValue,
	    int level, 
	    double weight) :
	CountConstraint(type, attr, operation, level, weight),
	comparisonValue(comparisonValue)
{
    assert(operation == EQUAL || operation == NOT_EQUAL);
}

bool CountStringConstraint::evaluate_condition(const string& str) const
{
    if(operation == EQUAL) {
	return (str == comparisonValue);
    } else {
	assert(operation== NOT_EQUAL);
	return (str != comparisonValue);
    }
}

bool CountStringConstraint::evaluate_condition(double d) const
{
    assert(false);	// This should never be called for this type of constraint
}

////////////////////// CountNumberConstraint ////////////////////////////////////

CountNumberConstraint::CountNumberConstraint(Constraint::Type type,
	    const Attribute* attr, 
	    Operation operation, 
	    double comparisonValue,
	    int level, 
	    double weight) :
	CountConstraint(type, attr, operation, level, weight),
	comparisonValue(comparisonValue)
{
}

bool CountNumberConstraint::evaluate_condition(const string& str) const
{
    assert(false);	// This should never be called for this type of constraint
}

bool CountNumberConstraint::evaluate_condition(double d) const
{
    switch(operation) {
	case LESS_THAN:
	    return (d < comparisonValue);
	case LESS_THAN_OR_EQUAL:
	    return (d <= comparisonValue);
	case EQUAL:
	    return (d == comparisonValue);
	case GREATER_THAN_OR_EQUAL:
	    return (d >= comparisonValue);
	case GREATER_THAN:
	    return (d > comparisonValue);
	case NOT_EQUAL:
	    return (d != comparisonValue);
	default:
	    assert(false);	// This shouldn't happen
	    return false;
    }
}

////////////////////// SimilarityConstraint ////////////////////////////////////

SimilarityConstraint::SimilarityConstraint(Constraint::Type type,
	    const Attribute* attr, int level, double weight) :
	Constraint(type, attr, level, weight) 
{
    assert(type == HOMOGENEOUS || type == HETEROGENEOUS);
}

bool SimilarityConstraint::evaluate_condition(const string& str) const
{
    assert(false);	// This should never be called for this type of constraint
}

bool SimilarityConstraint::evaluate_condition(double d) const
{
    assert(false);	// This should never be called for this type of constraint
}

////////////////////// RangeConstraint ////////////////////////////////////

RangeConstraint::RangeConstraint(Constraint::Type type,
	    const Attribute* attr, int level, double weight) :
	Constraint(type, attr, level, weight) 
{
    assert(type == HOMOGENEOUS || type == HETEROGENEOUS);
}

bool RangeConstraint::evaluate_condition(const string& str) const
{
    assert(false);	// This should never be called for this type of constraint
}

bool RangeConstraint::evaluate_condition(double d) const
{
    assert(false);	// This should never be called for this type of constraint
}

