//
// cost.cpp
//

#include "cost.hh"
#include "teamData.hh"

// Check whether the person meets the condition in the given constraint (if applicable). If
// the constraint doesn't have a condition then false is returned
// We evaluate all of these once at the beginning
static bool condition_met(const Constraint* constraint, const Person& person)
{
    const Attribute* attr = constraint->get_attribute();
    if(constraint->is_count_constraint()) {
	if(attr->is_numeric()) {
	    double value = person.get_numeric_attribute_value(attr);
	    return constraint->evaluate_condition(value);
	} else {
	    const string& value = person.get_string_attribute_value(attr);
	    return constraint->evaluate_condition(value);
	}
    } else {
	// Not a count constraint - value doesn't matter
	return false;
    }
}

// Initialise the "conditionMet" properties of each team member in a partition
static void initialise_conditions_for_partition(AnnealInfo& annealInfo, Partition* partition)
{
    int numConstraints = annealInfo.num_constraints();
    // Iterate over each member in the partition
    MemberIterator memberItr = partition->member_iterator();
    while(!memberItr.done()) {
	// Iterate over each constraint
	for(int c = 0; c < numConstraints; ++c) {
	    Constraint* constraint = annealInfo.get_constraint(c);
	    memberItr->append_condition_value(condition_met(constraint, memberItr->get_person()));
	}
	++memberItr;
    }
}

// Iterate over each low level member and determine whether they meet the condition for each relevant
// constraint. Then initalise all cost-constraint data.
void initialise_costs(AllTeamData* data)
{
    AnnealInfo& annealInfo = data->get_anneal_info();

    EntityListIterator partitionItr = data->get_partition_iterator();
    // Iterate over each partition
    while(!partitionItr.done()) {
	initialise_conditions_for_partition(annealInfo, partitionItr);
	++partitionItr;
    }
}

///////////////////////////////////////////////////////////////////////////////
double ConstraintCost::get_cost()
{
    if(constraint->applies_to_team_size(team->size())) {
	return cost;
    } else {
	return 0.0;
    }
}
