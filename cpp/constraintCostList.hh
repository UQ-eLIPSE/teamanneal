//
// constraintCostList
//

#ifndef CONSTRAINT_COST_LIST
#define CONSTRAINT_COST_LIST

#include <vector>

using namespace std;

class ConstraintCost;

class ConstraintCostList {
    friend class ConstraintCostListIterator;
protected:
    vector<ConstraintCost*> members;
public:
    void append(ConstraintCost* member);
    ConstraintCost* operator[](size_t i) const;
    size_t size() const;
    void delete_members();
};

// Iterator over a constraint cost list (above)
class ConstraintCostListIterator {
private:
    const ConstraintCostList* list;
    unsigned int posn;
public:
    ConstraintCostListIterator(const ConstraintCostList* list);	// can be nullptr
    ConstraintCostListIterator(const ConstraintCostList& list);
    bool done() const;		// true if no list or advanced past end of list
    void reset();
    operator ConstraintCost*() const;
    ConstraintCost* operator->() const;
    ConstraintCostListIterator& operator++(); // prefix
    ConstraintCostListIterator operator++(int); // postfix
};

#endif
