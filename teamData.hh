//
// teamData.hh
//

#ifndef TEAMDATA_HH
#define TEAMDATA_HH

#include "person.hh"
#include "annealinfo.hh"
#include <vector>
#include <map>
#include <string>

using namespace std;

class AllTeamData;
class EntityListIterator;
class Member;
class TeamLevel;

///////////////////////////////////////////////////////////////////////////////
class Entity {
public:
    enum Type { MEMBER, TEAM, PARTITION };
    Entity::Type type;
    const string name;
    TeamLevel* memberOf;	// team that this entity is part of, or null if top level

    // Constructor
    Entity(Entity::Type type);
    Entity(Entity::Type type, const string& name);

    // Other member functions
    bool has_name(const string& value) const;
    const string& get_name() const;
    Entity::Type get_type() const;
    void set_team(TeamLevel* team);
    TeamLevel* get_team() const;
    bool is_partition() const;
};

///////////////////////////////////////////////////////////////////////////////
class EntityList {
// types
    typedef EntityListIterator Iterator;
    friend class EntityListIterator;
protected:
    vector<Entity*> members;
public:

    // Member functions
    // Append member to this entity list and specify the entity's parent team as given
    void append(Entity* member, TeamLevel* parent = nullptr);
    void append_unique(Entity* member, TeamLevel* parent = nullptr);	// Does not append if already present
    Entity*& operator[](size_t i);
    Entity* find_entity_with_name(const string& name);
    size_t size() const;
    void reserve(size_t size);
    TeamLevel* get_subteam(size_t i);	// members must be teams
    EntityListIterator list_iterator() const;
    int find_index_of(Entity* member);	// return -1 if not found
};


///////////////////////////////////////////////////////////////////////////////
class EntityListIterator {
private:
    const EntityList& list;
    int entityNum;
public:
    EntityListIterator(const EntityList& list);
    Entity& operator*();
    Entity* operator->();
    operator Entity*() const;
    operator Member*() const;
    EntityListIterator& operator++();	// prefix
    EntityListIterator operator++(int);	// postfix
    bool done();	// returns true when the iterator has gone past the end of the list
};

///////////////////////////////////////////////////////////////////////////////
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

    // Other member functions
    const string& get_attribute_value(Attribute* attr);
};

///////////////////////////////////////////////////////////////////////////////
class TeamLevel : public Entity {
public:
    // Contains either another level of teams or individual members
    EntityList members;
    const Level& level;

    // Constructor
    TeamLevel(const Level& level);
    TeamLevel(const Level& level, const string& name);

    // Other member functions
    void add_member(Entity* member);
    TeamLevel* create_or_get_named_subteam(const string& subTeamName);
    const Level& get_level() const;
    int num_members() const;
    int find_index_of(Entity* member);	// return -1 if not found
};

///////////////////////////////////////////////////////////////////////////////
class Partition : public TeamLevel {
public:
    // highest level teams are those in the "members" inherited field
    AllTeamData* 	allTeamData;
    EntityList	 	lowestLevelTeams;
    EntityList	 	bestCostTeams;
    EntityList	 	allMembers;
    EntityList	 	unallocatedMembers;	// subset of allMembers
    double 		cost;
    double 		bestCost;

    // Constructor
    Partition(AllTeamData* allTeamData, const Level& level, const string& name, int numPeople);

    // Other member functions
    // Add a member to our partition. All members are added before teams are formed.
    void add_member(Member* member);

    void populate_random_teams();
    void populate_existing_teams();

    TeamLevel* create_or_get_named_team(const string& teamName);
};

///////////////////////////////////////////////////////////////////////////////
class AllTeamData {
public:
    AnnealInfo&			annealInfo;
    map<string,Partition*> 	partitionMap;
    EntityList	 		allMembers;

public:
    // Constructor - initialises our list of partitions and list of all members.
    AllTeamData(AnnealInfo& annealInfo);

    // Member functions
    void populate_random_teams();
    void populate_existing_teams();

    Partition* find_partition(const string& name);

    // Other functions
    int num_levels() const;
    const Level& get_level(int levelNum) const;

    // Returns the number of teams needed given the size constraints. Throws an exception 
    // if not possible to meet the constraints

    static int number_of_teams(int numMembers, int minSize, int idealSize, 
	    int maxSize, bool favourSmaller = false);
};

#endif
