//
// constraintCost.hh
//

#ifndef CONSTRAINTCOST_HH
#define CONSTRAINTCOST_HH

#include "teamData.hh"
#include "constraint.hh"
#include "person.hh"
#include <map>
#include "constraintCostList.hh"

// Global functions

// Initialise all cost related structures and variables
void initialise_costs(AllTeamData* data);

///////////////////////////////////////////////////////////////////////////////

// Cost of constraint for a given team - there is one of these objects for every team at the level the 
// constraint applies to. (The constraint may not apply if the team size is wrong but there will still
// be one of these objects

class ConstraintCost {
private:
    TeamLevel* team;
    Constraint* constraint;
    double cost;
public:
    // Check that the constraint applies (team size wise) and if so, return the cost, otherwise
    // return 0;
    double get_cost();
};

class CountConstraintCost : public ConstraintCost {
private:
    int count;
public:
};

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

