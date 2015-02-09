//
// cost.hh
//

#ifndef COST_HH
#define COST_HH

#include "constraintCost.hh"
#include "constraintCostList.hh"
#include "entity.hh"
#include "constraint.hh"
#include <map>
#include <ostream>

// Global data
class AllCostData;
extern AllCostData* allCostData;

// Global functions

// Initialise all cost related structures and variables
void initialise_costs(AllTeamData* data);
void output_cost_data(ostream& os);

///////////////////////////////////////////////////////////////////////////////
class CostData {
public:
    typedef map<const TeamLevel*,ConstraintCost*> TeamToCostMap;
private:
    map<const TeamLevel*,ConstraintCostList*>	teamToCostListMap;
    map<const Constraint*,ConstraintCostList*> constraintToCostListMap;

    // This map allows us to map from a constraint to a sub-map and then within that
    // map from a team to an individual constraint cost
    map<const Constraint*,TeamToCostMap*> constraintToTeamCostMap;

public:
    void add_constraint_cost(ConstraintCost* constraintCost);

    map<const TeamLevel*,ConstraintCostList*>::const_iterator team_begin() const;
    map<const TeamLevel*,ConstraintCostList*>::const_iterator team_end() const;

    ConstraintCostList* get_costs_for_constraint(Constraint* constraint) const;
    ConstraintCostList* get_costs_for_team(TeamLevel* team) const;
    ConstraintCost* get_cost(Constraint* constraint, TeamLevel* team) const;

};

///////////////////////////////////////////////////////////////////////////////
class AllCostData {
private:
    map<Partition*,CostData*> partitionCostMap;
public:
    void add_cost_data_for_partition(Partition* partition, CostData* costData);
    CostData* get_cost_data_for_partition(Partition* partition);

    //Iterators to beginning and end of map
    map<Partition*,CostData*>::const_iterator begin() const;
    map<Partition*,CostData*>::const_iterator end() const;
};

#endif
