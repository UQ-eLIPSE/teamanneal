//
// teamData.hh
//

#ifndef TEAMDATA_HH
#define TEAMDATA_HH

#include "person.hh"
#include "entity.hh"
#include "annealInfo.hh"
#include "level.hh"
#include <map>
#include <string>
#include <ostream>

using namespace std;

///////////////////////////////////////////////////////////////////////////////
class AllTeamData {
private:
    AnnealInfo&			annealInfo;
    map<string,Partition*> 	partitionMap;
    EntityList 			partitionList;
    map<const Person*,Partition*>	personToPartitionMap;

public:
    // Constructor - initialises our list of partitions and list of all members.
    AllTeamData(AnnealInfo& annealInfo);

    // Member functions
    AnnealInfo& get_anneal_info();
    void populate_random_teams();
    void populate_existing_teams();

    bool has_partitions() const;
    int num_partitions() const;
    Partition* find_partition(const string& name);

    // Other functions
    int num_levels() const;
    const Level& get_level(int levelNum) const;
    const vector<Level*>& all_levels() const;
    const vector<Constraint*>& all_constraints() const;
    vector<const Person*>& all_people() const;
    Partition* get_partition_for_person(const Person* person) const;
    EntityListIterator get_partition_iterator() const;

    // Call this after annealing in order to set team names - this sets names for the 
    // main teams - copy lowest cost teams back to the main structure before calling this
    void set_names_for_all_teams();

    // Output operator
    friend ostream& operator<<(ostream& os, const AllTeamData& all);

    // Returns the number of teams needed given the size constraints. Throws an exception 
    // if not possible to meet the constraints

    static int number_of_teams(int numMembers, int minSize, int idealSize, 
	    int maxSize, bool favourSmaller = false);
};

#endif
