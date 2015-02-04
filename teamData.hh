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
#include <ostream>

using namespace std;

class AllTeamData;
class EntityListIterator;
class Member;
class TeamLevel;
class Partition;

///////////////////////////////////////////////////////////////////////////////
class Entity {
public:
    enum Type { MEMBER, TEAM, PARTITION };
    Entity::Type type;
    const string& name;
    TeamLevel* memberOf;	// team that this entity is part of, or null if top level
    Partition* partition;	// partition that this entity is part of

    // Constructor
    Entity(Entity::Type type, Partition* partition);
    Entity(Entity::Type type, const string& name, Partition* partition);

    // Pure virtual destructor - we need to ensure the destructor of the appropriate subclass
    // is called when an Entity is deleted (e.g. from an EntityList)
    virtual ~Entity() = 0;

    // Other member functions
    bool has_name(const string& value) const;
    const string& get_name() const;
    Entity::Type get_type() const;
    void set_team(TeamLevel* team);
    TeamLevel* get_team() const;
    bool is_member() const;
    bool is_team() const;
    bool is_partition() const;

    // Output operator
    friend ostream& operator<<(ostream& os, const Entity& list);

    // Copy this entity
    virtual Entity* clone() = 0;
    // Output details about this entity
    virtual void output(ostream& os) const = 0;
};

///////////////////////////////////////////////////////////////////////////////
class EntityList {
// types
    typedef EntityListIterator Iterator;
    friend class EntityListIterator;
protected:
    vector<Entity*> members;
public:
    // Default Constructor
    EntityList();

    // Destructor - which will delete all our members individually
    ~EntityList();

    // Pseudo-copy Constructor
    EntityList(const EntityList& list, TeamLevel* parent);

    // Member functions
    // Append member to this entity list and specify the entity's parent team as given
    void append(Entity* member, TeamLevel* parent = nullptr);
    void append_unique(Entity* member, TeamLevel* parent);	// Does not append if already present
    Entity*& operator[](size_t i);
    Entity* find_entity_with_name(const string& name);
    size_t size() const;
    void reserve(size_t size);
    TeamLevel* get_subteam(size_t i);	// members must be teams
    EntityListIterator list_iterator() const;
    int find_index_of(Entity* member);	// return -1 if not found

    // Output operator
    friend ostream& operator<<(ostream& os, const EntityList& list);
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
private:
    const Person& person;	// links to attributes of this person
    vector<int> conditionMet;	// one entry for each constraint. If the constraint is a count
    				// constraint then this is 1 if the field-operator-value is true
				// e.g. 1 if "GPA > 5", 0 otherwise
				// Value ignored for non-count constraints.
				// (Indexed by constraint number 0 to num constraints minus 1
protected:
    // Copy constructor
    Member(const Member& member);

public:
    // Constructor
    Member(const Person& person, Partition* partition);

    // Other member functions
    const string& get_attribute_value(Attribute* attr);
    const Person& get_person();
    void output(ostream& os) const;

    // Copy this member (virtual
    Member* clone();
};

///////////////////////////////////////////////////////////////////////////////
class TeamLevel : public Entity {
protected:
    // Contains either another level of teams or individual members
    EntityList members;
    const Level& level;

    // Copy constructor
    TeamLevel(const TeamLevel& team);

public:
    // Constructor
    TeamLevel(const Level& level, Partition* partition);
    TeamLevel(const Level& level, const string& name, Partition* partition);

    // Other member functions
    void add_member(Entity* member);
    TeamLevel* create_or_get_named_subteam(const string& subTeamName);
    const Level& get_level() const;
    int num_members() const;
    virtual int find_index_of(Entity* member);	// return -1 if not found
    void output(ostream& os) const;

    // Copy this entity
    TeamLevel* clone();

};

///////////////////////////////////////////////////////////////////////////////
class Partition : public TeamLevel {
public:
    // highest level teams are those in the "members" inherited field
    AllTeamData* 	allTeamData;
    EntityList	 	lowestLevelTeams;
    EntityList	 	allMembers;
    EntityList	 	unallocatedMembers;	// subset of allMembers
    double 		cost;

    double 		lowestCost;
    EntityList*	 	lowestCostTopLevelTeams;
    map<const Person*,Member*>	lowestCostMemberMap;

    // Constructor
    Partition(AllTeamData* allTeamData, const Level& level, const string& name, int numPeople);

    // Other member functions
    // Add a member to our partition. All members are added before teams are formed. We return
    // a pointer to the Member instance we create
    Member* add_person(const Person* member);

    void populate_random_teams();
    void populate_existing_teams();

    void set_current_teams_as_lowest_cost();
    void update_lowest_cost_member_map(const Person* person, Member* member);
    Member* get_lowest_cost_member_for_person(const Person* person);
    // This checks the current member teams as well as the lowest cost teams, returns -1 if not found
    int find_index_of(Entity* member);

    TeamLevel* create_or_get_named_team(const string& teamName);

    void output(ostream& os) const;
};

///////////////////////////////////////////////////////////////////////////////
class AllTeamData {
private:
    AnnealInfo&			annealInfo;
    map<string,Partition*> 	partitionMap;
    ////EntityList	 		allMembers;
    map<const Person*,Partition*>	personToPartitionMap;

public:
    // Constructor - initialises our list of partitions and list of all members.
    AllTeamData(AnnealInfo& annealInfo);

    // Member functions
    AnnealInfo& get_anneal_info();
    void populate_random_teams();
    void populate_existing_teams();

    Partition* find_partition(const string& name);

    // Other functions
    int num_levels() const;
    const Level& get_level(int levelNum) const;
    const vector<Level*>& all_levels() const;
    vector<const Person*>& all_people() const;
    Partition* get_partition_for_person(const Person* person) const;

    // Output operator
    friend ostream& operator<<(ostream& os, const AllTeamData& all);

    // Returns the number of teams needed given the size constraints. Throws an exception 
    // if not possible to meet the constraints

    static int number_of_teams(int numMembers, int minSize, int idealSize, 
	    int maxSize, bool favourSmaller = false);
};

#endif
