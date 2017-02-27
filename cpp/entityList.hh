//
// entityList.hh
//

#ifndef ENTITYLIST_HH
#define ENTITYLIST_HH

#include <vector>
#include <string>
#include <ostream>

using namespace std;

class Entity;
class Member;
class TeamLevel;
class Partition;
class EntityListIterator;

///////////////////////////////////////////////////////////////////////////////
class EntityList {
// types
    typedef EntityListIterator Iterator;
    friend class EntityListIterator;
protected:
    vector<Entity*> members;
public:
    // Constructors
    EntityList();
    EntityList(Entity* child);

    // Destructor - which will delete all our members individually
    ~EntityList();

    // Copy constructor - shallow copy
    EntityList(const EntityList& list);

    // Pseudo-copy Constructor - semi-deep copy - we don't copy members, only teams. We
    // set new parents on copied teams to account for the new structure.
    // If the elements are at the lowest level (members) we only set their parents if
    // setMemberParents is true
    EntityList(const EntityList& list, TeamLevel* parent, bool setMemberParents);

    // Member functions
    void clear();			// Does not destroy members - warning - memory may be lost
    // Append member to this entity list 
    void append(Entity* member);
    // Remove member from the entity list. Any iterators on the list are then invalid. Order may change.
    void remove(Entity* member);
    //void append_unique(Entity* member);	// Does not append if already present, inefficient
    Entity* operator[](size_t i) const;
    TeamLevel* get_subteam(size_t i) const;	// members must be teams
    Entity* get_member(size_t i) const;	// members can be any type
    Entity* find_entity_with_name(const string& name);	// inefficient - searches list
    size_t size() const;
    void reserve(size_t size);
    EntityListIterator list_iterator() const;
    int find_index_of(Entity* member);	// return -1 if not found, inefficient - searches list
    Entity* first_member() const;

    // Output operator
    friend ostream& operator<<(ostream& os, const EntityList& list);
};


///////////////////////////////////////////////////////////////////////////////
class EntityListIterator {
private:
    const EntityList& list;
    unsigned int entityNum;
public:
    EntityListIterator(const EntityList& list);
    Entity& operator*() const;
    Entity* operator->() const;
    operator Entity*() const;
    operator Member*() const;
    operator TeamLevel*() const;
    operator Partition*() const;
    EntityListIterator& operator++();	// prefix
    EntityListIterator operator++(int);	// postfix
    bool done() const;	// returns true when the iterator has gone past the end of the list
    void reset();
};

#endif
