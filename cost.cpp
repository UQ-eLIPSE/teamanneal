//
// cost.cpp
//

#include "cost.hh"
#include "constraintCost.hh"
#include "constraintCostList.hh"
#include "teamData.hh"
#include "assert.h"

AllCostData* allCostData = nullptr;

///////////////////////////////////////////////////////////////////////////////
// Local functions

// Check whether the person meets the condition in the given constraint (if applicable). If
// the constraint doesn't have a condition then false is returned
// We evaluate all of these once at the beginning
static bool condition_met(const Constraint* constraint, const Person& person)
{
    const Attribute* attr = constraint->get_attribute();
    if(constraint->is_count_constraint()) {
	if(attr->is_numeric()) {
	    double value = person.get_numeric_attribute_value(attr);
	    return constraint->evaluate_condition(value);
	} else {
	    const string& value = person.get_string_attribute_value(attr);
	    return constraint->evaluate_condition(value);
	}
    } else {
	// Not a count constraint - value doesn't matter
	return false;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Global functions

// Iterate over each low level member and determine whether they meet the condition for each relevant
// constraint. Then initalise all cost-constraint data.
void initialise_costs(AllTeamData* data)
{
    AnnealInfo& annealInfo = data->get_anneal_info();
    allCostData = new AllCostData();

    EntityListIterator partitionItr = data->get_partition_iterator();
    // Iterate over each partition
    while(!partitionItr.done()) {
	CostData* partitionCostData = new CostData(annealInfo, partitionItr);
	allCostData->add_cost_data_for_partition(partitionItr, partitionCostData);
	++partitionItr;
    }
}

// Output all the cost data to the given stream
void output_cost_data(ostream& os)
{
    map<Partition*,CostData*>::const_iterator partitionItr = allCostData->begin();
    while(partitionItr != allCostData->end()) {
	Partition* partition = partitionItr->first;
	os << "Cost data for Partition " << partition->get_name() << endl;
	CostData* costData = partitionItr->second;
	CostData::TeamIterator teamItr = costData->team_begin();
	while(teamItr != costData->team_end()) {
	    const TeamLevel* team = teamItr->first;
	    const ConstraintCostList* constraintCostList = teamItr->second;
	    os << "  Team " << team->get_name() << ": ";
	    // Show team members
	    MemberIterator memberItr = team->member_iterator();
	    while(!memberItr.done()) {
		os << memberItr->get_id() << " ";
		++memberItr;
	    }
	    os << endl;
	    ConstraintCostListIterator costListItr(constraintCostList);
	    while(!costListItr.done()) {
		// Check team for this entry is same as expected
		const TeamLevel* teamForConstraintCost = costListItr->get_team();
		assert(team == teamForConstraintCost);
		const Constraint* constraint = costListItr->get_constraint();
		os << "    Constraint " << constraint->get_constraint_number();
		os << " cost " << costListItr->get_cost() << endl;
		++costListItr;
	    }
	    ++teamItr;
	}
	++partitionItr;
    }
}

///////////////////////////////////////////////////////////////////////////////
// CostData

void CostData::add_constraint_cost(ConstraintCost* constraintCost)
{
    ConstraintCostList* costList;

    const TeamLevel* team = constraintCost->get_team();
    const Constraint* constraint = constraintCost->get_constraint();
    TeamToCostMap* teamCostMap;

    // Check if we have a list for this team
    map<const TeamLevel*,ConstraintCostList*>::iterator teamListItr = teamToCostListMap.find(team);
    if(teamListItr == teamToCostListMap.end()) {
	// No entry found for this team - create one and add it to our map
	costList = new ConstraintCostList();
	teamToCostListMap.insert(pair<const TeamLevel*,ConstraintCostList*>(team,costList));
    } else {
	// Found the list
	costList = teamListItr->second;
    }
    // Add the cost to this list
    costList->append(constraintCost);

    // Check if we have a list for this constraint
    map<const Constraint*,ConstraintCostList*>::iterator constraintListItr = 
	    constraintToCostListMap.find(constraint);
    if(constraintListItr == constraintToCostListMap.end()) {
	// No entry found for this constraint - create one and add it to our map
	costList = new ConstraintCostList();
	constraintToCostListMap.insert(pair<const Constraint*,ConstraintCostList*>(constraint,costList));
	// Also need to create an entry for our team-to-cost map
	teamCostMap = new TeamToCostMap();
	constraintToTeamCostMap.insert(pair<const Constraint*,TeamToCostMap*>(constraint,teamCostMap));
    } else {
	// Found the list
	costList = constraintListItr->second;
	// Get the existing team map - there must be one
	map<const Constraint*,TeamToCostMap*>::iterator itr = constraintToTeamCostMap.find(constraint);
	assert(itr != constraintToTeamCostMap.end());
	teamCostMap = itr->second;
    }
    // Add the cost to this list and to the individual team cost map
    costList->append(constraintCost);
    teamCostMap->insert(pair<const TeamLevel*,ConstraintCost*>(team, constraintCost));

    // Update cost totals
    cost += constraintCost->get_cost();
    costPendingMove += constraintCost->get_pending_cost();	// should be the same as above
}

// Constructor
CostData::CostData(AnnealInfo& annealInfo, Partition* partition) :
	annealInfo(annealInfo),
	partition(partition),
	cost(0.0),
	costPendingMove(0.0)
{
    // Iterate over each member in the partition and determine whether the conditions are 
    // met for each constraint (set the "conditionMet" property)
    int numConstraints = annealInfo.num_constraints();
    MemberIterator memberItr = partition->member_iterator();
    while(!memberItr.done()) {
	// Iterate over each constraint
	for(int c = 0; c < numConstraints; ++c) {
	    Constraint* constraint = annealInfo.get_constraint(c);
	    memberItr->append_condition_value(condition_met(constraint, memberItr->get_person()));
	}
	++memberItr;
    }
    initialise_constraint_costs();
}

void CostData::initialise_constraint_costs()
{
    cout << "---------------------------------" << endl;
    cout << "| Initialising constraint costs |" << endl;
    cout << "---------------------------------" << endl;
    // Iterate over all the constraint cost lists and delete all the members
    CostData::TeamIterator teamListItr = this->team_begin();
    while(teamListItr != this->team_end()) {
	teamListItr->second->delete_members();
	delete teamListItr->second;
	++teamListItr;
    }
    teamToCostListMap.clear();
    constraintToCostListMap.clear();
    costsToBeUpdatedOnMove.clear();
    constraintToTeamCostMap.clear();
    cost = 0;
    costPendingMove = 0;

    // For each constraint, iterate over the teams at that level and built up the cost data
    int numConstraints = annealInfo.num_constraints();
    for(int c = 0; c < numConstraints; ++c) {
	Constraint* constraint = annealInfo.get_constraint(c);
	EntityListIterator teamItr(partition->teams_at_level_iterator(constraint->get_level()));
	// Iterate over the teams at this level
	while(!teamItr.done()) {
	    this->add_constraint_cost(ConstraintCost::construct((TeamLevel*)teamItr, constraint));
	    ++teamItr;
	}
    }
}

CostData::TeamIterator CostData::team_begin() const
{
    return teamToCostListMap.cbegin();
}

CostData::TeamIterator CostData::team_end() const
{
    return teamToCostListMap.cend();
}

ConstraintCostList* CostData::get_costs_for_constraint(Constraint* constraint) const
{
    map<const Constraint*,ConstraintCostList*>::const_iterator itr = 
	    constraintToCostListMap.find(constraint);
    assert(itr != constraintToCostListMap.end());		// must be found
    return itr->second;
}

ConstraintCostList* CostData::get_costs_for_team(TeamLevel* team) const
{
    CostData::TeamIterator itr = teamToCostListMap.find(team);
    assert(itr != teamToCostListMap.end());		// must be found
    return itr->second;
}

ConstraintCost* CostData::get_constraint_cost(Constraint* constraint, TeamLevel* team) const
{
    map<const Constraint*,TeamToCostMap*>::const_iterator itr = 
	    constraintToTeamCostMap.find(constraint);
    assert(itr != constraintToTeamCostMap.end());	// must be found
    // Have found our map from teams to individual constraint costs, now look for the team
    // within this
    TeamToCostMap::const_iterator costItr = itr->second->find(team);
    assert(costItr != itr->second->end());		// must be found
    return costItr->second;
}

double CostData::get_cost_value() const
{
    return cost;
}

double CostData::get_pending_cost_value() const
{
    return costPendingMove;
}

double CostData::pend_remove_member(Member* member)
{
    // Work out which team this member is in
    TeamLevel* team = member->get_parent();
    assert(team);

    double deltaCost = 0.0;
    // Iterate over the constraint costs for the team to update their costs
    ConstraintCostListIterator itr(get_costs_for_team(team));
    while(!itr.done()) {
	deltaCost += itr->pend_remove_member(member);
	costsToBeUpdatedOnMove.insert(itr);
	++itr;
    }
    costPendingMove += deltaCost;
    return deltaCost;
}


double CostData::pend_add_member(Member* member, TeamLevel* lowLevelTeam)
{
    double deltaCost = 0.0;
    // Iterate over the constraint costs for the team to update their costs
    ConstraintCostListIterator itr(get_costs_for_team(lowLevelTeam));
    while(!itr.done()) {
	deltaCost += itr->pend_add_member(member);
	costsToBeUpdatedOnMove.insert(itr);
	++itr;
    }
    costPendingMove += deltaCost;
    return deltaCost;
}

void CostData::commit_pending()
{
    // Iterate over all the pending cost changes and apply them
    unordered_set<ConstraintCost*>::iterator itr = costsToBeUpdatedOnMove.begin();
    while(itr != costsToBeUpdatedOnMove.end()) {
	(*itr)->commit_pending();
	++itr;
    }
    // Clear list of pending moves
    costsToBeUpdatedOnMove.clear();
    // Update overall cost
    cost = costPendingMove;
}

void CostData::undo_pending()
{
    // Iterate over all the pending cost changes and undo them
    unordered_set<ConstraintCost*>::iterator itr = costsToBeUpdatedOnMove.begin();
    while(itr != costsToBeUpdatedOnMove.end()) {
	(*itr)->undo_pending();
	++itr;
    }
    // Clear list of pending moves
    costsToBeUpdatedOnMove.clear();
    // Restore the cost pending any moves
    costPendingMove = cost;
}

///////////////////////////////////////////////////////////////////////////////
// AllCostData

void AllCostData::add_cost_data_for_partition(Partition* partition, CostData* costData) 
{
    partitionCostMap.insert(pair<Partition*,CostData*>(partition,costData));
}

CostData* AllCostData::get_cost_data_for_partition(Partition* partition)
{
    map<Partition*,CostData*>::iterator itr = partitionCostMap.find(partition);
    assert(itr != partitionCostMap.end());		// must be found
    return itr->second;
}

map<Partition*,CostData*>::const_iterator AllCostData::begin() const
{
    return partitionCostMap.cbegin();
}

map<Partition*,CostData*>::const_iterator AllCostData::end() const
{
    return partitionCostMap.cend();
}
