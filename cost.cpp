//
// cost.cpp
//

#include "cost.hh"
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

// Initialise the "conditionMet" properties of each team member in a partition
static void initialise_costs_for_partition(AnnealInfo& annealInfo, Partition* partition,
	CostData* partitionCostData)
{
    int numConstraints = annealInfo.num_constraints();
    // Iterate over each member in the partition and determine whether the conditions are 
    // met for each constraint
    MemberIterator memberItr = partition->member_iterator();
    while(!memberItr.done()) {
	// Iterate over each constraint
	for(int c = 0; c < numConstraints; ++c) {
	    Constraint* constraint = annealInfo.get_constraint(c);
	    memberItr->append_condition_value(condition_met(constraint, memberItr->get_person()));
	}
	++memberItr;
    }
    // For each constraint, iterate over the teams at that level and built up the cost data
    for(int c = 0; c < numConstraints; ++c) {
	Constraint* constraint = annealInfo.get_constraint(c);
	EntityListIterator teamItr(partition->teams_at_level_iterator(constraint->get_level()));
	// Iterate over the teams at this level
	while(!teamItr.done()) {
	    partitionCostData->add_constraint_cost(
		    ConstraintCost::construct((TeamLevel*)teamItr, constraint));
	    ++teamItr;
	}
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
	CostData* partitionCostData = new CostData();
	allCostData->add_cost_data_for_partition(partitionItr, partitionCostData);
	initialise_costs_for_partition(annealInfo, partitionItr, partitionCostData);
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
	map<const TeamLevel*,ConstraintCostList*>::const_iterator teamItr = costData->team_begin();
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
}

map<const TeamLevel*,ConstraintCostList*>::const_iterator CostData::team_begin() const
{
    return teamToCostListMap.cbegin();
}

map<const TeamLevel*,ConstraintCostList*>::const_iterator CostData::team_end() const
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
    map<const TeamLevel*,ConstraintCostList*>::const_iterator itr = 
	    teamToCostListMap.find(team);
    assert(itr != teamToCostListMap.end());		// must be found
    return itr->second;
}

ConstraintCost* CostData::get_cost(Constraint* constraint, TeamLevel* team) const
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
