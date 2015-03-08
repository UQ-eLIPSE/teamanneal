//
// anneal.cpp
//

#include "anneal.hh"
#include "entity.hh"
#include "moveSet.hh"
#include <ctime>
#include <thread>
#include <list>
#include <atomic>
#include <iostream>

using namespace std;

static list<AnnealThread*> allThreads;

///////////////////////////////////////////////////////////////////////////////
// Global functions

void anneal_all_partitions(AllTeamData* teamData, AllCostData* allCostData) 
{
    int countDonePartitions = 0;
    int numPartitions = 0;
    EntityListIterator partitionItr = teamData->get_partition_iterator();
    // Start all the threads
    while(!partitionItr.done()) {
	Partition* partition = (Partition*)partitionItr;
	cerr << "Starting partition " << partition->get_name() << endl;
	allThreads.push_back(new AnnealThread(partition, allCostData->get_cost_data_for_partition(partition)));
	++partitionItr;
	++numPartitions;
    }
    while(!allThreads.empty()) {
	this_thread::sleep_for(chrono::milliseconds(500));
	// Iterate over all the threads and see which ones are done. (Progress percent is 100% if done.)
	int sumPercent = countDonePartitions * 100;
	for(list<AnnealThread*>::iterator itr = allThreads.begin(); itr != allThreads.end(); ++itr) {
	    int percentProgressThisPartition = (*itr)->get_progress_percent();
	    if(percentProgressThisPartition == 100) {
		// Partition is done
		countDonePartitions++;
		if(numPartitions > 1) {
		    cerr << "Partition " << (*itr)->get_partition_name() << " is done" << endl;
		}
		// Delete the data structure (this joins the thread)
		delete (*itr);
		// Remove it from the list 
		allThreads.erase(itr);
	    }
	    sumPercent += percentProgressThisPartition;
	}
	int percentComplete = sumPercent / numPartitions;
	cerr << "Percent complete: " << percentComplete << "%" << endl;
    }
}

void anneal_all_partitions_single_thread(AllTeamData* teamData, AllCostData* allCostData) 
{
    int countDonePartitions = 0;
    int numPartitions = teamData->num_partitions();
    EntityListIterator partitionItr = teamData->get_partition_iterator();
    // Start all the threads
    while(!partitionItr.done()) {
	Partition* partition = (Partition*)partitionItr;
	CostData* costData = allCostData->get_cost_data_for_partition(partition);
	AnnealThread* thread = new AnnealThread(partition, costData);
	cerr << "Starting partition " << thread->get_partition_name() << endl;
	while(true) {
	    this_thread::sleep_for(chrono::milliseconds(500));
	    int sumPercent = countDonePartitions * 100;
	    int percentProgressThisPartition = thread->get_progress_percent();
	    if(percentProgressThisPartition == 100) {
		// Partition is done
		countDonePartitions++;
		if(numPartitions > 1) {
		    cerr << "Partition " << thread->get_partition_name() << " is done" << endl;
		}
		// Delete the data structure (this joins the thread)
		delete thread;
		break;
	    }

	    sumPercent += percentProgressThisPartition;
	    int percentComplete = sumPercent / numPartitions;
	    cerr << "Percent complete: " << percentComplete << "%" << endl;
	}

	++partitionItr;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Local functions
///////////////////////////////////////////////////////////////////////////////
// AnnealThread

// Constructor
AnnealThread::AnnealThread(Partition* partition, CostData* costData) :
	partition(partition),
	progressPercent(0)
{
    moveSet = new MoveSet(partition, costData);
    annealThread = thread(&MoveSet::do_anneal, moveSet, this);
}

// Destructor
AnnealThread::~AnnealThread()
{
    // Thread should be done - we join it to reclaim resources
    annealThread.join();
    delete moveSet;
}

void AnnealThread::update_progress(unsigned char percent)
{
    progressPercent = percent;
}

unsigned char AnnealThread::get_progress_percent()
{
    return progressPercent;
}

const string& AnnealThread::get_partition_name()
{
    return partition->get_name();
}
