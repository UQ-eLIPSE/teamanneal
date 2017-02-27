//
// anneal.hh
//

#ifndef ANNEAL_HH
#define ANNEAL_HH

#include "teamData.hh"
#include "cost.hh"
#include "moveSet.hh"
#include <thread>
#include <atomic>

///////////////////////////////////////////////////////////////////////////////
// Global function

void anneal_all_partitions(AllTeamData* teamData, AllCostData* allCostData);
void anneal_all_partitions_single_thread(AllTeamData* teamData, AllCostData* allCostData);

///////////////////////////////////////////////////////////////////////////////
// Classes

class AnnealThread {
private:
    Partition* partition;
    MoveSet* moveSet;
    thread annealThread;
    atomic_uchar progressPercent;	// 0 to 100
public:
    AnnealThread(Partition* partition, CostData* costData);
    ~AnnealThread();
    void update_progress(unsigned char percent);
    unsigned char get_progress_percent();
    const string& get_partition_name();
};

#endif
