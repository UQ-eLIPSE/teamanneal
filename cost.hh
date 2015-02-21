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
#include <unordered_set>

// Global data
class AllCostData;
extern AllCostData* allCostData;

// Global functions

// Initialise all cost related structures and variables
void initialise_costs(AllTeamData* data);
void output_cost_data(ostream& os);

///////////////////////////////////////////////////////////////////////////////
// CostData
//
// One of these per partition

class CostData {
public:
    AnnealInfo& annealInfo;
    Partition* partition;
    typedef map<const TeamLevel*,ConstraintCost*> TeamToCostMap;
    typedef map<const TeamLevel*,ConstraintCostList*>::const_iterator TeamIterator;
private:
    map<const TeamLevel*,ConstraintCostList*>	teamToCostListMap;
    map<const Constraint*,ConstraintCostList*> constraintToCostListMap;
    double cost;
    double costPendingMove;
    unordered_set<ConstraintCost*> costsToBeUpdatedOnMove;

    // This map allows us to map from a constraint to a sub-map and then within that
    // map from a team to an individual constraint cost
    map<const Constraint*,TeamToCostMap*> constraintToTeamCostMap;

    void add_constraint_cost(ConstraintCost* constraintCost);
public:
    // Constructor
    CostData(AnnealInfo& annealInfo, Partition* partition);

    void initialise_constraint_costs();

    TeamIterator team_begin() const;
    TeamIterator team_end() const;

    ConstraintCostList* get_costs_for_constraint(Constraint* constraint) const;
    ConstraintCostList* get_costs_for_team(TeamLevel* team) const;
    ConstraintCost* get_constraint_cost(Constraint* constraint, TeamLevel* team) const;
    double get_cost_value() const;
    double get_pending_cost_value() const;

    // Queue a potential move - returns the delta cost of this move (negative is better).
    // Updates the list of pending moves
    double pend_remove_member(Member* member);
    double pend_add_member(Member* member, TeamLevel* lowLevelTeam);
    // Commit/undo the pending changes
    void commit_pending();		// This should be done AFTER actual team changes
    void undo_pending();
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
