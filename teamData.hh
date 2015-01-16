//
// teamData.hh
//

#ifndef TEAMDATA_HH
#define TEAMDATA_HH

#include "person.hh"
#include "annealinfo.hh"
#include <vector>
#include <map>

using namespace std;

class AllTeamData;

class Entity {
public:
    enum Type { MEMBER, TEAM, PARTITION };
    Entity::Type type;

    // Constructor
    Entity(Entity::Type type);
};

class Member : public Entity {
public:
    Person& person;	// links to attributes of this person
    vector<int> conditionMet;	// one entry for each constraint. If the constraint is a count
    				// constraint then this is 1 if the field-operator-value is true
				// e.g. 1 if "GPA > 5", 0 otherwise
				// Value ignored for non-count constraints.
				// (Indexed by constraint number 0 to num constraints minus 1
    // Constructor
    Member(Person& person);
};

class TeamLevel : public Entity {
public:
    // Contains either another level of teams or individual members
    vector<Entity*> members;
    const Level& level;
    ////////// CHECK this name - should it be a reference
    const string* name;		// for teams created with names

    // Constructor
    TeamLevel(const Level& level);
    TeamLevel(const Level& level, const string& name);

    // Other member functions
    void add_member(Entity* member);
};

class Partition : public Entity {
public:
    const AllTeamData& 	allTeamData;
    const string& 	name;		// empty if no partitions - values of the partition field
    vector<TeamLevel*> 	lowestLevelTeams;
    vector<TeamLevel*> 	highestLevelTeams;
    vector<TeamLevel*> 	bestCostTeams;
    vector<Member*> 	allMembers;
    vector<Member*> 	unallocatedMembers;
    double 		cost;
    double 		bestCost;

    // Constructor
    Partition(const AllTeamData& allTeamData, const string& name, int numPeople);

    // Other member functions
    // Add a member to our partition. All members are added before teams are formed.
    void add_member(Member* member);

    void populate_random_teams();
    void populate_existing_teams();
};

class AllTeamData {
public:
    vector<Level*>& allLevels;
    map<string,Partition*> partitionMap;
    vector<Member*> allMembers;

public:
    // Constructor - initialises our list of partitions and list of all members.
    AllTeamData(AnnealInfo& annealInfo);

    // Member functions
    void populate_random_teams();
    void populate_existing_teams();

    Partition* find_partition(const string& name);

    // Other functions
    // Returns the number of teams needed given the size constraints. Throws an exception 
    // if not possible to meet the constraints

    static int number_of_teams(int numMembers, int minSize, int idealSize, 
	    int maxSize, bool favourSmaller = false);
};

#endif
