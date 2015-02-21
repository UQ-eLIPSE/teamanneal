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

class ConstraintCostListIterator {
private:
    const ConstraintCostList* list;
    int posn;
public:
    ConstraintCostListIterator(const ConstraintCostList* list);
    ConstraintCostListIterator(const ConstraintCostList& list);
    bool done() const;
    void reset();
    operator ConstraintCost*() const;
    ConstraintCost* operator->() const;
    ConstraintCostListIterator& operator++(); // prefix
    ConstraintCostListIterator operator++(int); // postfix
};

#endif
