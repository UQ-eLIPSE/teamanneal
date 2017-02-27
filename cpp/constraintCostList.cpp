//
// constraintCostList.cpp
//

#include "constraintCostList.hh"
#include "constraintCost.hh"
#include <assert.h>

void ConstraintCostList::append(ConstraintCost* member)
{
    members.push_back(member);
}

ConstraintCost* ConstraintCostList::operator[](size_t i) const
{
    return members[i];
}

size_t ConstraintCostList::size() const
{
    return members.size();
}

void ConstraintCostList::delete_members()
{
    ConstraintCostListIterator itr(this);
    while(!itr.done()) {
	delete (ConstraintCost*)itr;
	++itr;
    }
    members.clear();
}

///////////////////////////////////////////////////////////////////////////////
// ConstraintCostListIterator

// Constructors
ConstraintCostListIterator::ConstraintCostListIterator(const ConstraintCostList* list) :
	list(list),
	posn(0)
{
}

ConstraintCostListIterator::ConstraintCostListIterator(const ConstraintCostList& list) :
	list(&list),
	posn(0)
{
}

bool ConstraintCostListIterator::done() const
{
    return (!list || (posn >= list->size()));
}

void ConstraintCostListIterator::reset()
{
    posn = 0;
}

ConstraintCostListIterator::operator ConstraintCost*() const
{
    assert(list);
    return list->members[posn];
}

ConstraintCost* ConstraintCostListIterator::operator->() const
{
    assert(list);
    return list->members[posn];
}

ConstraintCostListIterator& ConstraintCostListIterator::operator++()	//prefix
{
    assert(list);
    posn++;
    return (*this);
}

ConstraintCostListIterator  ConstraintCostListIterator::operator++(int)	// postfix
{
    assert(list);
    ConstraintCostListIterator tmp(*this);	// Copy iterator to preserve state before increment
    posn++;
    return tmp;
}

