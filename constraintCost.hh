//
// constraintCost.hh
//

#ifndef CONSTRAINTCOST_HH
#define CONSTRAINTCOST_HH

#include "teamData.hh"
#include "constraint.hh"
#include "person.hh"
#include <map>

///////////////////////////////////////////////////////////////////////////////

// Cost of constraint for a given team - there is one of these objects for every team at the level the 
// constraint applies to. (The constraint may not apply if the team size is wrong but there will still
// be one of these objects.) This is an abstract base class - descendant classes will be specific to the
// types of constraints since constraint specific data needs to be stored.

class ConstraintCost {
protected:
    const TeamLevel* team;
    const Constraint* constraint;
    double cost;
    // Constructor
    ConstraintCost(const TeamLevel* team, const Constraint* constraint);

public:
    // Check that the constraint applies (team size wise) and if so, return the cost, otherwise
    // return 0;
    double get_cost();

    const TeamLevel* get_team() const;
    const Constraint* get_constraint() const;

    virtual void evaluate() = 0;

    // Factory
    static ConstraintCost* construct(const TeamLevel* team, const Constraint* constraint);
};

///////////////////////////////////////////////////////////////////////////////
// CountConstraintCost

// Costs of constraints which relate to counts of the number of members with certain properties
class CountConstraintCost : public ConstraintCost {
private:
    int numMembersConsidered;
    int count;
    int target;
public:
    // Constructor
    CountConstraintCost(const TeamLevel* team, const Constraint* constraint);

    void do_count();
    void evaluate();
};

///////////////////////////////////////////////////////////////////////////////
// SimilarityConstraintCost

// Costs of constraints which relate to string fields with same value 
class SimilarityConstraintCost : public ConstraintCost {
private:
    vector<int> valueCount;	// Indexed by attribute string value index
    int countDistinctValues;
    int numMembersConsidered;
    int numAttributeValues;
public:
    // Constructor
    SimilarityConstraintCost(const TeamLevel* team, const Constraint* constraint);

    void do_count();
    void evaluate();
};

///////////////////////////////////////////////////////////////////////////////
// RangeConstraintCost

// Costs of constraints which relate to string fields with same value 
class RangeConstraintCost : public ConstraintCost {
private:
    double minValue;
    double maxValue;
    double sumOfValues;
    double sumOfSquareValues;
    int numMembersConsidered;
    double attributeValueRange;
public:
    // Constructor
    RangeConstraintCost(const TeamLevel* team, const Constraint* constraint);

    void do_count();
    void evaluate();

    double std_dev();	// return standard deviation of values in this team
    double range();	// return range of values in this team
};

///////////////////////////////////////////////////////////////////////////////
#if 0
class PartitionCostDetails {
    map<const TeamLevel*,ConstraintCostList> teamToCostMap;	// which costs are applicable to the given team
    double cost;
    double lowestCost;
};

class constraintCost {
public:
    int constraintNumber;	// 0 to number of constraints minus one
    TeamLevel* team;		// Each constraint applies at only one level

    virtual void evaluate() = 0;	// how we evaluate the cost will depend on the type
    					// of constraint
};

class numericalRangeConstraintCost : public constraintCost {

    virtual void evaluate();
};
#endif

#endif

