/*
 * constraint.hh
 */

#ifndef CONSTRAINT_HH
#define CONSTRAINT_HH

#include "attribute.hh"
#include <string>
using namespace std;

///////////////////////////////////////////////////////////////////////////////
class Constraint {
public:
    enum Type { COUNT_EXACT, COUNT_NOT_EXACT, COUNT_AT_LEAST, COUNT_AT_MOST, 
	    COUNT_MAXIMISE, COUNT_MINIMISE, HOMOGENEOUS, HETEROGENEOUS };
    enum Operation { LESS_THAN, 
            LESS_THAN_OR_EQUAL,
            EQUAL,
            GREATER_THAN_OR_EQUAL,
            GREATER_THAN,
            NOT_EQUAL };
    
    // Type of this constraint
    Constraint::Type type;

    // Field (attribute) associated with this constraint
    const Attribute* attribute;

    // Level that this constraint applies to (1 means top level, etc.)
    // Groups at the lowermost level (highest number) contain people, 
    // others contain groups of groups
    int level;

    // Team size that this constraint applies to (0 means all teams)
    int applicableTeamSize;

    // Weight associated with this constraint
    double weight;
    
    ////////////

    // Constructor
    Constraint(Constraint::Type type, const Attribute* attr, int level, double weight);

    // Other member functions
    Constraint::Type get_type(void);
    void set_applicable_team_size(int teamSize);
    bool applies_to_team_size(int teamSize);
};

///////////////////////////////////////////////////////////////////////////////
class CountConstraint : public Constraint {
public:
    int targetCount;		// Only for COUNT_EXACT, ...NOT_EXACT, ...AT_LEAST, ...AT_MOST
    Operation operation;	

    // Constructor
    CountConstraint(Constraint::Type type, const Attribute* attr, Operation operation,
	    int level, double weight);

    // Other member functions
    void set_target(int target);
};

///////////////////////////////////////////////////////////////////////////////
class CountStringConstraint : public CountConstraint {
public:
    string comparisonValue;	

    // Constructor
    CountStringConstraint(Constraint::Type type, const Attribute* attr, Operation operation,
	    const string& comparisonValue, int level, double weight);

};

///////////////////////////////////////////////////////////////////////////////
class CountNumberConstraint : public CountConstraint {
public:
    double comparisonValue;

    // Constructor
    CountNumberConstraint(Constraint::Type type, const Attribute* attr, Operation operation,
	    double comparisonValue, int level, double weight);
};

///////////////////////////////////////////////////////////////////////////////
class SimilarityConstraint : public Constraint {
public:
    // Constructor
    // type must be one of HOMOGENEOUS or HETEROGENEOUS
    // field must be of string type
    SimilarityConstraint(Constraint::Type type, const Attribute* attr,
	    int level, double weight);
};

///////////////////////////////////////////////////////////////////////////////
class RangeConstraint : public Constraint {
public:
    // Constructor
    // type must be one of HOMOGENEOUS or HETEROGENEOUS
    // field must be numerical
    RangeConstraint(Constraint::Type type, const Attribute* attr,
	    int level, double weight);
};

#endif
