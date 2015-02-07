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
