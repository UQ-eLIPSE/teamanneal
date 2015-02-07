//
// constraintCostList
//

#ifndef CONSTRAINT_COST_LIST
#define CONSTRAINT_COST_LIST

#include <vector>
class ConstraintCost;

class ConstraintCostList {
protected:
    vector<ConstraintCost*> members;
public:
    void append(ConstraintCost* member);
    ConstraintCost* operator[](size_t i) const;
    size_t size() const;
};

#endif
