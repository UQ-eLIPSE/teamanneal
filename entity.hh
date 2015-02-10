//
// entity.hh
//

#ifndef ENTITY_HH
#define ENTITY_HH

#include "person.hh"
#include "annealinfo.hh"
#include "entityList.hh"
#include "memberIterator.hh"
#include <vector>
#include <map>
#include <string>
#include <ostream>
#include <functional>
#include <random>

using namespace std;

class Member;
class TeamLevel;
class Partition;
class AllTeamData;

///////////////////////////////////////////////////////////////////////////////
class Entity {
public:
    enum Type { MEMBER, TEAM, PARTITION };
    Entity::Type type;
    string name;
    TeamLevel* parent;	// team that this entity is part of, or null if top level (partition)
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

    // If the name is not already set, then set it. Return the current name.
    const string& set_name(const string& value);

    Entity::Type get_type() const;

    void set_parent(TeamLevel* team);
    TeamLevel* get_parent() const;

    bool is_member() const;
    bool is_team() const;
    bool is_partition() const;

    // Output operator
    friend ostream& operator<<(ostream& os, const Entity& list);

    // Output details about this entity
    virtual void output(ostream& os) const = 0;
};

///////////////////////////////////////////////////////////////////////////////
class Member : public Entity {
private:
    const Person& person;	// links to attributes of this person
    vector<bool> conditionMet;	// one entry for each constraint. If the constraint is a count
    				// constraint then this is true if the field-operator-value is true
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
    const string& get_attribute_value(const Attribute* attr) const;
    double get_numeric_attribute_value(const Attribute* attr) const;
    int get_attribute_value_index(const Attribute* attr) const;
    const Person& get_person() const;
    const string& get_id() const;
    void output(ostream& os) const;
    void append_condition_value(bool met);
    bool is_condition_met(int constraintNumber) const;
};

///////////////////////////////////////////////////////////////////////////////
class TeamLevel : public Entity {
protected:
    // Contains either another level of teams or individual members
    EntityList 		children;
    const Level& 	level;
    string	fullTeamName;		// only used for lowest level teams


public:
    // Constructor
    // Pseudo-copy constructor - we clone the team, all the way down to, but excluding, 
    // the lowest level members. If setMemberParents is true we set the parents of the
    // members to be the new teams
    TeamLevel(const TeamLevel* team, bool setMemberParents);
    TeamLevel(const Level& level, Partition* partition);
    TeamLevel(const Level& level, const string& name, Partition* partition);

    // Other member functions
    void add_child(Entity* child);
    const Level& get_level() const;
    const EntityList& get_children() const;
    Entity* get_first_child() const;
    int num_children() const;
    int size() const;
    virtual int find_index_of(Entity* child);	// must be found
    void output(ostream& os) const;
    EntityListIterator child_iterator() const;
    MemberIterator member_iterator() const;

    void set_full_team_name(const string& name);
    const string& get_full_team_name() const;

    // Copy this team
    TeamLevel* clone(bool setMemberParents);

};

///////////////////////////////////////////////////////////////////////////////
// Partition

// NOTE - can't delete a Partition - the EntityList destructor will result in 
// some entities being deleted multiple times
class Partition : public TeamLevel {
protected:
    // highest level teams are those in the "children" inherited field
    AllTeamData* 	allTeamData;
    EntityList*		teamsAtEachLevel[MAX_LEVELS + 1];
    EntityList	 	unallocatedMembers;	// subset of allMembers
    EntityList 		allMembers;	// contains lowest level members - all members are added
    					// to this list before being put in teams
    map<const Person*,Member*>	personToMemberMap;

    double 		cost;

    double 		lowestCost;
    EntityList*	 	lowestCostTopLevelTeams;

private:
    mt19937 rnGenerator;	// Mersenne twister 19937 state generator
    uniform_int_distribution<int> rnDistribution;
    function<int()> dice;
public:

    // Constructor
    Partition(AllTeamData* allTeamData, const Level& level, const string& name, int numPeople);

    // Other member functions
    Attribute* get_partition_attribute() const;		// nullptr if there is none
    // Add a member to our partition. All members are added before teams are formed. We return
    // a pointer to the Member instance we create
    Member* add_person(const Person* member);
    Member* get_member_for_person(const Person*);

    void clear();	// clear out memberships in preparation for copying them from elsewhere
    			// e.g. from lowest cost or random or ...
    void populate_random_teams();
    void populate_existing_teams();
    void restore_lowest_cost_teams();

    void set_current_teams_as_lowest_cost();

    Member* get_random_member();

    // This checks the current member teams as well as the lowest cost teams, returns -1 if not found
    int find_index_of(Entity* member);
    // Get an iterator over teams at the given level
    EntityListIterator teams_at_level_iterator(int levelNum) const;
    EntityListIterator teams_at_lowest_level_iterator() const;
    AllTeamData* get_all_team_data() const;

    void output(ostream& os) const;
};

#endif
