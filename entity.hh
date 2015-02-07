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
    const string& name;
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

    Entity::Type get_type() const;

    void set_parent(TeamLevel* team);
    TeamLevel* get_parent() const;

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
    const string& get_attribute_value(Attribute* attr);
    const Person& get_person();
    void output(ostream& os) const;
    void append_condition_value(bool met);
    bool is_condition_met(int constraintNumber) const;

    // Copy this member (virtual function)
    Member* clone();
};

///////////////////////////////////////////////////////////////////////////////
class TeamLevel : public Entity {
protected:
    // Contains either another level of teams or individual members
    EntityList 		children;
    const Level& 	level;

    // Copy constructor
    TeamLevel(const TeamLevel& team);

public:
    // Constructor
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

    // Copy this entity
    TeamLevel* clone();

};

///////////////////////////////////////////////////////////////////////////////
// NOTE - can't delete a Partition - the EntityList destructor will result in 
// some entities being deleted multiple times
class Partition : public TeamLevel {
public:
    // highest level teams are those in the "children" inherited field
    AllTeamData* 	allTeamData;
    EntityList*		teamsAtEachLevel[MAX_LEVELS + 1];
    EntityList	 	unallocatedMembers;	// subset of allMembers
    EntityList 		allMembers;	// contains lowest level members - all members are added
    					// to this list before being put in teams
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

    void output(ostream& os) const;
};

#endif
