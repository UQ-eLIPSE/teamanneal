//
// anneal.cpp
//

#include "anneal.hh"
#include "entity.hh"
#include "moveSet.hh"
#include <ctime>
#include <thread>
#include <vector>

using namespace std;

///////////////////////////////////////////////////////////////////////////////
// Local functions

static void anneal_partition(Partition* partition, CostData* costData)
{
    MoveSet* moveSet = new MoveSet(partition, costData);
    moveSet->do_anneal();
}

///////////////////////////////////////////////////////////////////////////////
// Global functions

// will create threads in here eventually
void anneal_all_partitions(AllTeamData* teamData, AllCostData* allCostData) 
{
    vector<thread> threads;

    EntityListIterator partitionItr = teamData->get_partition_iterator();
    while(!partitionItr.done()) {
	Partition* partition = (Partition*)partitionItr;
	anneal_partition(partition, allCostData->get_cost_data_for_partition(partition));
	++partitionItr;
    }
}
