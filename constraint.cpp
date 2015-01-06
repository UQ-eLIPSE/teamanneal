/*
 * constraint.cpp
 */

#include "constraint.hh"
#include <assert.h>

////////////////////// Constraint ///////////////////////////////////////////////

Constraint::Constraint(const Attribute& attr, Constraint::Type type, int level, double weight) : 
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

////////////////////// CountStringConstraint ////////////////////////////////////

CountStringConstraint::CountStringConstraint(Constraint::Type type,
	    const Attribute& attr, int target,
	    Operation operation, string& comparisonValue,
	    int level, double weight) :
	Constraint(attr, type, level, weight),
	targetCount(target),
	operation(operation),
	comparisonValue(comparisonValue)
{
    assert(type == COUNT_EXACT || type == COUNT_AT_LEAST || type == COUNT_AT_MOST);
}

CountStringConstraint::CountStringConstraint(Constraint::Type type,
	    const Attribute& attr, 
	    Operation operation, string& comparisonValue,
	    int level, double weight) :
	Constraint(attr, type, level, weight),
	operation(operation),
	comparisonValue(comparisonValue)
{
    assert(type == COUNT_MINIMISE || type == COUNT_MAXIMISE);
}

////////////////////// CountNumberConstraint ////////////////////////////////////

CountNumberConstraint::CountNumberConstraint(Constraint::Type type,
	    const Attribute& attr, int target,
	    Operation operation, double comparisonValue,
	    int level, double weight) :
	Constraint(attr, type, level, weight),
	targetCount(target),
	operation(operation),
	comparisonValue(comparisonValue)
{
    assert(type == COUNT_EXACT || type == COUNT_AT_LEAST || type == COUNT_AT_MOST);
}

CountNumberConstraint::CountNumberConstraint(Constraint::Type type,
	    const Attribute& attr, 
	    Operation operation, double comparisonValue,
	    int level, double weight) :
	Constraint(attr, type, level, weight),
	operation(operation),
	comparisonValue(comparisonValue)
{
    assert(type == COUNT_MINIMISE || type == COUNT_MAXIMISE);
}

////////////////////// SimilarityConstraint ////////////////////////////////////

SimilarityConstraint::SimilarityConstraint(Constraint::Type type,
	    const Attribute& attr, int level, double weight) :
	Constraint(attr, type, level, weight) 
{
    assert(type == HOMOGENEOUS || type == HETEROGENEOUS);
}

