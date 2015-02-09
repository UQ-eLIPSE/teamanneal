//
// stats.hh
//

#ifndef STATS_HH
#define STATS_HH

#include <string>
#include "entity.hh"
#include "teamData.hh"

using namespace std;

void stats_init(const string& inputCSVFileName,
		      const string& inputConstraintFilename,
		      const string& outputCSVFileName);
void stats_set_end_time();
void stats_add_partition_stats(Partition* partition);
void stats_add_for_all_partitions(AllTeamData* data);


#endif
