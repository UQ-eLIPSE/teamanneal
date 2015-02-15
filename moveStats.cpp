//
// moveStats.cpp
//

#include "moveStats.hh"
#include "json.hh"
#include "cost.hh"

JSONObject* statsJSON = nullptr;

void calculate_move_stats(AllTeamData* data, const Person* person)
{
    statsJSON = new JSONObject();
    statsJSON->append("id", person->get_id());
    JSONNumber* minCostChangeJSON = new JSONNumber();
    statsJSON->append("min-cost-change", minCostChangeJSON);
    JSONNumber* maxCostChangeJSON = new JSONNumber();
    statsJSON->append("max-cost-change", maxCostChangeJSON);
    JSONNumber* removeCostJSON = new JSONNumber();
    statsJSON->append("remove-cost", removeCostJSON);
    JSONArray* moveCostArrayJSON = new JSONArray();
    statsJSON->append("move-costs", moveCostArrayJSON);

    double minCostChange = 0.0;
    double maxCostChange = 0.0;

    Partition* originPartition = data->get_partition_for_person(person);
    Member* member = originPartition->get_member_for_person(person);
    // Work out the cost of removing this member from their team (if any)
    CostData* costData = allCostData->get_cost_data_for_partition(originPartition);
    double removeCost = 0.0;
    if(member->has_parent()) {
	removeCost = costData->pend_remove_member(member);
	originPartition->remove_member_from_lowest_level_team(member);
	costData->commit_pending();
    } // else, not in a team
    removeCostJSON->set_value(removeCost);

    EntityListIterator partitionItr = data->get_partition_iterator();
    while(!partitionItr.done()) {
	Partition* partition = (Partition*)partitionItr;
	costData = allCostData->get_cost_data_for_partition(partition);

	// Iterate over each team in the partition and work out the cost to add them to that 
	// team - both with and without team size constraints
	JSONObject* partitionJSON = new JSONObject();
	moveCostArrayJSON->append(partitionJSON);
	if(data->has_partitions()) {
	    partitionJSON->append("partition", partition->get_name());
	} else {
	    partitionJSON->append_null("partition");
	}
	JSONArray* teamArrayJSON = new JSONArray();
	partitionJSON->append("teams", teamArrayJSON);
	EntityListIterator teamItr = partition->teams_at_lowest_level_iterator();
	while(!teamItr.done()) {
	    TeamLevel* team = (TeamLevel*)teamItr;
	    // Add the team with name details to the JSON object
	    JSONObject* teamJSON = new JSONObject();
	    teamArrayJSON->append(teamJSON);
	    JSONArray* nameArray = new JSONArray();
	    teamJSON->append("name", nameArray);
	    nameArray->append(team->get_full_team_name());
	    // Work up the hierarchy, adding team names to structure
	    TeamLevel* teamCursor = team;
	    while(!teamCursor->is_partition()) {
		nameArray->append(teamCursor->get_name());
		teamCursor = teamCursor->get_parent();
	    }
	    // Evaluate the cost of adding the member to this team
	    double deltaCost = removeCost + costData->pend_add_member(member, team);
	    teamJSON->append("cost", deltaCost);
	    if(deltaCost < minCostChange) {
		minCostChange = deltaCost;
	    }
	    if(deltaCost > maxCostChange) {
		maxCostChange = deltaCost;
	    }
	    costData->undo_pending();

	    ++teamItr;
	}
	++partitionItr;
    }
    minCostChangeJSON->set_value(minCostChange);
    maxCostChangeJSON->set_value(maxCostChange);
}

void output_move_stats(ostream& os) 
{
    os << *statsJSON << endl;
}
