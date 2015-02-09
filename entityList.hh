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

    // Pseudo-copy Constructor
    EntityList(const EntityList& list, TeamLevel* parent);

    // Member functions
    // Append member to this entity list 
    void clear();
    void append(Entity* member);
    void append_unique(Entity* member);	// Does not append if already present, inefficient
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
    int entityNum;
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
