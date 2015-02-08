//
// constraintCost.hh
//

#ifndef CONSTRAINTCOST_HH
#define CONSTRAINTCOST_HH

#include "teamData.hh"
#include "constraint.hh"
#include "person.hh"
#include <map>

///////////////////////////////////////////////////////////////////////////////

// Cost of constraint for a given team - there is one of these objects for every team at the level the 
// constraint applies to. (The constraint may not apply if the team size is wrong but there will still
// be one of these objects.) This is an abstract base class - descendant classes will be specific to the
// types of constraints since constraint specific data needs to be stored.

class ConstraintCost {
protected:
    const TeamLevel* team;
    const Constraint* constraint;
    double cost;			// of current state and committed moves
    double costPendingMove;
    int teamSizePendingMove;
    // Constructor
    ConstraintCost(const TeamLevel* team, const Constraint* constraint);

public:
    // Check that the constraint applies (team size wise) and if so, return the cost, otherwise
    // return 0;
    double get_cost();
    double get_pending_cost();
    double delta_cost();		// pending minus committed

    const TeamLevel* get_team() const;
    const Constraint* get_constraint() const;

    virtual void evaluate() = 0;	// evaluate cost of current situation (pending move)
    virtual void commit_pending();	// commit the cost changes associated with pending moves
    					// (we assume this happens after teams are updated so that
					// we can update the teamSizePendingMove)
    virtual void undo_pending();	// Undo any pending changes (team membership unchanged)

    // Factory
    static ConstraintCost* construct(const TeamLevel* team, const Constraint* constraint);
};

///////////////////////////////////////////////////////////////////////////////
// CountConstraintCost

// Costs of constraints which relate to counts of the number of members with certain properties
class CountConstraintCost : public ConstraintCost {
private:
    int numMembersConsidered;
    int count;
    int target;

    int numMembersPendingMove;
    int countPendingMove;
public:
    // Constructor
    CountConstraintCost(const TeamLevel* team, const Constraint* constraint);

private:
    void initialise();		// initalise
public:
    void evaluate();		// update pending cost based on current count, num members, target, constraint etc.
    void commit_pending();	// commit the pending move(s) - update count, numMembersConsidered, cost
    void undo_pending();
};

///////////////////////////////////////////////////////////////////////////////
// SimilarityConstraintCost

// Costs of constraints which relate to string fields with same value 
class SimilarityConstraintCost : public ConstraintCost {
private:
    vector<int> valueCount;	// Indexed by attribute string value index
    int countDistinctValues;
    int numMembersConsidered;

    int numAttributeValues;

    vector<int> valueCountsToIncrementPendingMove;
    vector<int> valueCountsToDecrementPendingMove;
    int countDistinctValuesPendingMove;
    int numMembersPendingMove;

public:
    // Constructor
    SimilarityConstraintCost(const TeamLevel* team, const Constraint* constraint);

private:
    void initialise();		// intialise
public:
    void evaluate();		// update pending cost based on current data
    void commit_pending();	// commit the pending move(s) - update member variables
    void undo_pending();
};

///////////////////////////////////////////////////////////////////////////////
// RangeConstraintCost

// Costs of constraints which relate to string fields with same value 
class RangeConstraintCost : public ConstraintCost {
private:
    double minValue;
    double maxValue;
    double sumOfValues;
    double sumOfSquareValues;
    int numMembersConsidered;

    double attributeValueRange;

    double minValuePendingMove;
    double maxValuePendingMove;
    double sumOfValuesPendingMove;
    double sumOfSquareValuesPendingMove;
    int numMembersPendingMove;
public:
    // Constructor
    RangeConstraintCost(const TeamLevel* team, const Constraint* constraint);

private:
    void initialise();
public:
    void evaluate();		// update pending cost based on current data
    void commit_pending();
    void undo_pending();

    double std_dev();	// return standard deviation of values in this team - pending moves
    double range();	// return range of values in this team - pending moves
};

#endif

