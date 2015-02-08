//
// constraintCostList.cpp
//

#include "constraintCostList.hh"

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

///////////////////////////////////////////////////////////////////////////////
// ConstraintCostListIterator

// Constructors
ConstraintCostListIterator::ConstraintCostListIterator(const ConstraintCostList* list) :
	list(*list),
	posn(0)
{
}

ConstraintCostListIterator::ConstraintCostListIterator(const ConstraintCostList& list) :
	list(list),
	posn(0)
{
}

bool ConstraintCostListIterator::done() const
{
    return (posn >= list.size());
}

ConstraintCostListIterator::operator ConstraintCost*() const
{
    return list.members[posn];
}

ConstraintCost* ConstraintCostListIterator::operator->() const
{
    return list.members[posn];
}

ConstraintCostListIterator& ConstraintCostListIterator::operator++()	//prefix
{
    posn++;
    return (*this);
}

ConstraintCostListIterator  ConstraintCostListIterator::operator++(int)	// postfix
{
    ConstraintCostListIterator tmp(*this);	// Copy iterator to preserve state before increment
    posn++;
    return tmp;
}

