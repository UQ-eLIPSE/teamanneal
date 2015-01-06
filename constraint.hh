/*
 * constraint.hh
 */

#ifndef CONSTRAINT_HH
#define CONSTRAINT_HH

#include "attribute.hh"

class Constraint {
public:
    enum Type { COUNT_EXACT, COUNT_AT_LEAST, COUNT_AT_MOST, COUNT_MAXIMISE, COUNT_MINIMISE,
	    HOMOGENEOUS, HETEROGENEOUS };
    enum Operation { LESS_THAN, 
            LESS_THAN_OR_EQUAL,
            EQUAL,
            GREATER_THAN_OR_EQUAL,
            GREATER_THAN,
            NOT_EQUAL };
    
    // Type of this constraint
    Constraint::Type type;

    // Attribute associated with this constraint
    const Attribute& attribute;

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
    Constraint(const Attribute& attr, Constraint::Type type, int level, double weight);

    // Other member functions
    Constraint::Type get_type(void);
    void set_applicable_team_size(int teamSize);
    bool applies_to_team_size(int teamSize);
};

class CountStringConstraint : public Constraint {
public:
    int targetCount;		// Only for COUNT_EXACT, COUNT_AT_LEAST, COUNT_AT_MOST
    Operation operation;	// Only EQUAL or NOT_EQUAL is supported
    string comparisonValue;	

    // Constructors
    // type must be one of COUNT_EXACT, COUNT_AT_LEAST, COUNT_AT_MOST in the following
    CountStringConstraint(Constraint::Type type, const Attribute& attr, int target,
	    Operation operation, string& value, int level, double weight);
    // type must be one of COUNT_MINIMISE, COUNT_MAXIMISE in the following
    CountStringConstraint(Constraint::Type type, const Attribute& attr, Operation operation,
	    string& value, int level, double weight);
};

class CountNumberConstraint : public Constraint {
public:
    int targetCount;		// Only for COUNT_EXACT, COUNT_AT_LEAST, COUNT_AT_MOST
    Operation operation;	// Any operator is OK
    double comparisonValue;

    // Constructors
    // type must be one of COUNT_EXACT, COUNT_AT_LEAST, COUNT_AT_MOST in the following
    CountNumberConstraint(Constraint::Type type, const Attribute& attr, int target,
	    Operation operation, double value, int level, double weight);
    // type must be one of COUNT_MINIMISE, COUNT_MAXIMISE in the following
    CountNumberConstraint(Constraint::Type type, const Attribute& attr, Operation operation,
	    double value, int level, double weight);
};

class SimilarityConstraint : public Constraint {
public:
    // Constructor
    // type must be one of HOMOGENEOUS or HETEROGENEOUS
    SimilarityConstraint(Constraint::Type type, const Attribute& attr, 
	    int level, double weight);
};

#endif
