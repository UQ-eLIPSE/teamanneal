//
// memberIterator.cpp
//

#include "memberIterator.hh"
#include "entity.hh"
#include "assert.h"

///////////////////////////////////////////////////////////////////////////////
// MemberIterator
void MemberIterator::find_next(bool advance)
{
    if(listStack.size() == 0) {
	return;		// End of the road - we've traversed everything
    }
    EntityListIterator& top = listStack.top();
    if(top.done()) {
	// We're done at this level - go up one and keep trying
	listStack.pop();
	find_next(true);
    } else if(advance) {
	++top;
	find_next(false);
    } else if(top->is_member()) {
	// We've found a member - stop here
    } else {
	assert(top->is_team());
	// We're at a team level - go lower
	listStack.emplace(((TeamLevel*)top)->get_children());
	// Find next member if we're not at one
	find_next(false);
    }
}

// Constructor
MemberIterator::MemberIterator(const TeamLevel* team)
{
    // Work our way down to the lowest level
    listStack.emplace(team->get_children());
    find_next(false);
}

Member& MemberIterator::operator*() const
{
    const EntityListIterator& top = listStack.top();
    return *(Member*)top;
}

Member* MemberIterator::operator->() const
{
    const EntityListIterator& top = listStack.top();
    return (Member*)top;
}

MemberIterator::operator Member*() const
{
    const EntityListIterator& top = listStack.top();
    return (Member*)top;
}

MemberIterator& MemberIterator::operator++()	// prefix
{
    // Get top of stack - if it points to something
    assert(!listStack.top().done());
    find_next(true);
    return *this;
}

MemberIterator MemberIterator::operator++(int)	// postfix
{
    MemberIterator tmp(*this);
    ++(*this);
    return tmp;
}

bool MemberIterator::done() const
{
    if(listStack.size() == 0) {
	return true;
    } else {
	const EntityListIterator& top = listStack.top();
	return top.done();
    }
}

