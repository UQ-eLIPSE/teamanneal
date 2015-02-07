//
// memberIterator.hh
//

#ifndef MEMBERITERATOR_HH
#define MEMBERITERATOR_HH

#include "person.hh"
#include "entityList.hh"
#include <stack>

using namespace std;

class Member;

///////////////////////////////////////////////////////////////////////////////
class MemberIterator {
private:
    stack<EntityListIterator> listStack;
    void find_next(bool advance);		// find the current member - if advance is true
  						// then we move on to the next member.
public:
    MemberIterator(const TeamLevel* team);
    Member& operator*() const;
    Member* operator->() const;
    operator Member*() const;
    MemberIterator& operator++();	// prefix
    MemberIterator operator++(int);	// postfix
    bool done() const;	// returns true when the iterator has gone past the end of the list
};

#endif
