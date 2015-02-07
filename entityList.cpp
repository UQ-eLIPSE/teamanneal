//
// entityList.cpp
//

#include "entityList.hh"
#include "teamData.hh"
#include "assert.h"

static string emptyString("");

///////////////////////////////////////////////////////////////////////////////
// EntityList

EntityList::EntityList()
{
}

EntityList::EntityList(Entity* child)
{
    append(child);
}

// Pseudo copy constructor - entities are made children of the given parent
EntityList::EntityList(const EntityList& list, TeamLevel* parent)
{
    assert(parent);
    members.reserve(list.size());
    EntityListIterator itr(list);
    while(!itr.done()) {
	Entity* copy = itr->clone();
	append(copy);
	copy->set_parent(parent);
	++itr;
    }
}

// Destructor
EntityList::~EntityList()
{
    // Delete each of the entities that are part of this list.
    // Because some entities are in multiple lists, we really should change this destructor to be
    // more careful
    EntityListIterator itr(*this);
    while(!itr.done()) {
	delete (Entity*)itr;
	++itr;
    }
}

void EntityList::append(Entity* member)
{
    members.push_back(member);
}

// Not very efficient
void EntityList::append_unique(Entity* member)
{
    EntityListIterator itr(*this);
    while(!itr.done()) {
	if((Entity*)itr == member) {
	    return;
	}
	++itr;
    }

    // Did not find member - add it
    members.push_back(member);
}

Entity* EntityList::operator[](size_t i) const
{
    return members[i];
}

TeamLevel* EntityList::get_subteam(size_t i) const
{
    Entity* element = members[i];
    assert(element->get_type() == Entity::TEAM);
    return (TeamLevel*)element;
}

Entity* EntityList::get_member(size_t i) const
{
    return members[i];
}

Entity* EntityList::find_entity_with_name(const string& name)
{
    // search the vector to find the entity
    for(EntityListIterator it = list_iterator(); !it.done(); ++it) {
	if(it->has_name(name)) {
	    return it;
	}
    }
    // Not found
    return nullptr;
}

size_t EntityList::size() const
{
    return members.size();
}

void EntityList::reserve(size_t size)
{
    members.reserve(size);
}

EntityListIterator EntityList::list_iterator() const
{
    return EntityListIterator(*this);
}

int EntityList::find_index_of(Entity* member)
{
    EntityListIterator itr(*this);
    int count = 0;
    while(!itr.done()) {
	if(member == (Entity*)itr) {
	    return count;
	}
	++count;
	++itr;
    }
    return -1;	// Not found
}

Entity* EntityList::first_member() const
{
    assert(members.size() > 0);
    return members[0];
}

ostream& operator<<(ostream& os, const EntityList& list)
{
    os << " {" << endl;
    EntityListIterator itr(list);
    while(!itr.done()) {
	os << "   " << *itr;
	++itr;
    }
    return os;
}

///////////////////////////////////////////////////////////////////////////////
// EntityListIterator

// Constructor
EntityListIterator::EntityListIterator(const EntityList& list) :
	list(list),
	entityNum(0)
{
}

Entity& EntityListIterator::operator*() const
{
    return *(list.members[entityNum]);
}

Entity* EntityListIterator::operator->() const
{
    return list.members[entityNum];
}

EntityListIterator::operator Entity*() const
{
    return list.members[entityNum];
}

EntityListIterator::operator Member*() const
{
    return (Member*)(list.members[entityNum]);
}

EntityListIterator::operator TeamLevel*() const
{
    return (TeamLevel*)(list.members[entityNum]);
}

EntityListIterator::operator Partition*() const
{
    return (Partition*)(list.members[entityNum]);
}

EntityListIterator& EntityListIterator::operator++()
{
    entityNum++;
    return (*this);
}

EntityListIterator EntityListIterator::operator++(int)	// postfix
{
    EntityListIterator tmp(*this);		// Copy iterator to preserve state before increment
    entityNum++;
    return tmp;
}

bool EntityListIterator::done() const
{
    return entityNum >= list.size();
}

void EntityListIterator::reset()
{
    entityNum = 0;
}

