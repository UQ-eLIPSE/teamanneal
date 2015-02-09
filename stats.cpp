//
// stats.cpp
//

#include "stats.hh"
#include "json.hh"
#include "cost.hh"
#include <ctime>
#include "assert.h"

#define TIME_FORMAT "%Y-%m-%d %H:%M:%S"

static JSONObject* statsJSON = nullptr;

// Elements within the above
static JSONArray* partitionStatsArray = nullptr;
static JSONString* endTime = nullptr;

///////////////////////////////////////////////////////////////////////////////
// Local functions

static string get_current_time()
{
    time_t now;
    struct tm * timeinfo;

    time(&now);
    timeinfo = localtime(&now);
    char startTimeBuf[80];
    strftime(startTimeBuf, 80, TIME_FORMAT, timeinfo);
    return string(startTimeBuf);
}

static JSONArray* stats_constraint_performance(Partition* partition, CostData* costData)
{
    JSONArray* constraintPerformanceArray = new JSONArray();
    const vector<Constraint*>& constraints = partition->get_all_team_data()->all_constraints();
    vector<Constraint*>::const_iterator constraintItr = constraints.begin();
    while(constraintItr != constraints.end()) {
	Constraint* constraint = *constraintItr;
	// Iterate over all cost data for this constraint and work out the performance
	// of this constraint
	ConstraintCostList* costs = costData->get_costs_for_constraint(constraint);
	ConstraintCostListIterator costItr(costs);
	int numApplicableTeams = 0;
	double sumPercentageMet = 0.0;
	while(!costItr.done()) {
	    assert(costItr->get_constraint() == constraint);	// make sure constraints match
	    const TeamLevel* team = costItr->get_team();
	    // Make sure this team is at a level for this constraint
	    assert(team->get_level().get_level_num() == constraint->get_level());
	    // Make sure this constraint applies to this team (size wise)
	    if (constraint->applies_to_team_size(team->size())) {
		++numApplicableTeams;
		sumPercentageMet += costItr->percent_constraint_met();
	    }
	    ++costItr;
	}
	++constraintItr;
	// Add constraint specific statistics to the array
	double constraintPercentMet = 100.0;
	if(numApplicableTeams > 0){
	    constraintPercentMet = sumPercentageMet / numApplicableTeams;
	}
	constraintPerformanceArray->append(constraintPercentMet);
    }
    return constraintPerformanceArray;
}

static JSONArray* stats_team_stats(Partition* partition, CostData* costData)
{
    JSONArray* statsForAllTeams = new JSONArray();
    // Iterate over each lowest level team
    EntityListIterator teamItr = partition->lowest_cost_teams_iterator();
    while(!teamItr.done()) {
	TeamLevel* team = teamItr;
	JSONObject* teamStats = new JSONObject();
	JSONArray* nameArray = new JSONArray();
	teamStats->append("name", nameArray);
	teamStats->append("size", (double)team->size());
	nameArray->append(team->get_full_team_name());
	cout << "*** " << team->get_full_team_name() << endl;
	while(!team->is_partition()) {
	    cout << "***** " << team->get_name() << endl;
	    nameArray->append(team->get_name());
	    team = team->get_parent();
	}
	JSONArray* constraintPerformanceArray = new JSONArray();
	teamStats->append("constraint-performance", constraintPerformanceArray);

	const vector<Constraint*>& constraints = partition->get_all_team_data()->all_constraints();
	vector<Constraint*>::const_iterator constraintItr = constraints.begin();
	while(constraintItr != constraints.end()) {
	    ConstraintCost* cost = costData->get_cost(*constraintItr, teamItr);
	    constraintPerformanceArray->append(cost->percent_constraint_met());
	    ++constraintItr;
	}
	statsForAllTeams->append(teamStats);
	++teamItr;
    }
    return statsForAllTeams;
}

static void stats_add_partition_stats(Partition* partition)
{
    JSONObject* partitionStats = new JSONObject();
    if(partition->get_partition_attribute()) {
	// There are partitions - output a name
	partitionStats->append("partition", partition->get_name());
    }

    CostData* costData = allCostData->get_cost_data_for_partition(partition);

    // Output details of constraint performance
    JSONArray* constraintStats = stats_constraint_performance(partition, costData);
    partitionStats->append("constraint-performance", constraintStats);

    // Output details of teams
    JSONArray* teamStats = stats_team_stats(partition, costData);
    partitionStats->append("teams", teamStats);

    partitionStatsArray->append(partitionStats);
}


///////////////////////////////////////////////////////////////////////////////
// Public functions

void stats_init(const string& inputCSVFileName,
		      const string& inputConstraintFilename,
		      const string& outputCSVFileName)
{
    statsJSON = new JSONObject();
    statsJSON->append("input-csv-file-name", inputCSVFileName);
    statsJSON->append("constraint-file-name", inputConstraintFilename);
    statsJSON->append("output-csv-file-name", outputCSVFileName);

    statsJSON->append("start-time", get_current_time());
    endTime = statsJSON->append("end-time", string(""));

    partitionStatsArray = new JSONArray();
    statsJSON->append("stats", partitionStatsArray);
}

void stats_set_end_time()
{
    endTime->set_value(get_current_time());
}

void stats_add_for_all_partitions(AllTeamData* teamData)
{
    EntityListIterator partitionItr = teamData->get_partition_iterator();
    while(!partitionItr.done()) {
	stats_add_partition_stats((Partition*)partitionItr);
	++partitionItr;
    }
}

void stats_output(ostream& os)
{
    os << *statsJSON;
}
