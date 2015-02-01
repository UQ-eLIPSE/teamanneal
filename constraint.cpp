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
	weight(weight) {}

Constraint::Type Constraint::get_type() {
    return type;
}

void Constraint::set_applicable_team_size(int teamSize) {
    applicableTeamSize = teamSize;
}

bool Constraint::applies_to_team_size(int teamSize) {
    return (applicableTeamSize == 0 || teamSize == applicableTeamSize);
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

////////////////////// SimilarityConstraint ////////////////////////////////////

SimilarityConstraint::SimilarityConstraint(Constraint::Type type,
	    const Attribute* attr, int level, double weight) :
	Constraint(type, attr, level, weight) 
{
    assert(type == HOMOGENEOUS || type == HETEROGENEOUS);
}

////////////////////// RangeConstraint ////////////////////////////////////

RangeConstraint::RangeConstraint(Constraint::Type type,
	    const Attribute* attr, int level, double weight) :
	Constraint(type, attr, level, weight) 
{
    assert(type == HOMOGENEOUS || type == HETEROGENEOUS);
}

