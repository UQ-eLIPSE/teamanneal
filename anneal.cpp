//
// anneal.cpp
//

#include "anneal.hh"
#include "entity.hh"
#include "moveSet.hh"
#include <ctime>

///////////////////////////////////////////////////////////////////////////////
// Global functions

// will create threads in here eventually
void anneal_all_partitions(AllTeamData* teamData, AllCostData* allCostData) 
{
    EntityListIterator partitionItr = teamData->get_partition_iterator();
    while(!partitionItr.done()) {
	Partition* partition = (Partition*)partitionItr;
	MoveSet* moveSet = new MoveSet(partition, allCostData->get_cost_data_for_partition(partition));
	moveSet->do_anneal();
	++partitionItr;
    }
}
