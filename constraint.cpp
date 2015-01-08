/*
 * constraint.cpp
 */

#include "constraint.hh"
#include <assert.h>

////////////////////// Constraint ///////////////////////////////////////////////

Constraint::Constraint(Constraint::Type type, const string& field, int level, double weight) : 
	type(type),
        fieldName(field), 
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
	    const string& field, 
	    Operation operation, 
	    int level, 
	    double weight) :
	Constraint(type, field, level, weight),
	targetCount(0),
	operation(operation)
{
    assert(type != HOMOGENEOUS && type != HETEROGENEOUS);
}

void CountConstraint::set_target(int target)
{
    assert(type == COUNT_EXACT || type == COUNT_AT_LEAST || type == COUNT_AT_MOST);
    targetCount = target;
}

////////////////////// CountStringConstraint ////////////////////////////////////

CountStringConstraint::CountStringConstraint(Constraint::Type type,
	    const string& field, 
	    Operation operation, 
	    string& comparisonValue,
	    int level, 
	    double weight) :
	CountConstraint(type, field, operation, level, weight),
	comparisonValue(comparisonValue)
{
    assert(operation == EQUAL || operation == NOT_EQUAL);
}

////////////////////// CountNumberConstraint ////////////////////////////////////

CountNumberConstraint::CountNumberConstraint(Constraint::Type type,
	    const string& field, 
	    Operation operation, 
	    double comparisonValue,
	    int level, 
	    double weight) :
	CountConstraint(type, field, operation, level, weight),
	comparisonValue(comparisonValue)
{
}

////////////////////// SimilarityConstraint ////////////////////////////////////

SimilarityConstraint::SimilarityConstraint(Constraint::Type type,
	    const string& field, int level, double weight) :
	Constraint(type, field, level, weight) 
{
    assert(type == HOMOGENEOUS || type == HETEROGENEOUS);
}

