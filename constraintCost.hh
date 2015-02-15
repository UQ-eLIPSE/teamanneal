//
// constraintCost.hh
//

#ifndef CONSTRAINTCOST_HH
#define CONSTRAINTCOST_HH

#include "teamData.hh"
#include "constraint.hh"
#include "person.hh"
#include "entity.hh"
#include <map>
#include <vector>

///////////////////////////////////////////////////////////////////////////////
// ConstraintCost

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
    // Destructor (virtual)
    virtual ~ConstraintCost();

public:
    // Check that the constraint applies (team size wise) and if so, return the cost, otherwise
    // return 0;
    double get_cost();
    double get_pending_cost();
    double delta_cost();		// pending minus committed, negative if better

    const TeamLevel* get_team() const;
    const Constraint* get_constraint() const;

    virtual void evaluate() = 0;	// evaluate cost of current situation (pending move)
    virtual void commit_pending();	// commit the cost changes associated with pending moves
    					// (we assume this happens after teams are updated so that
					// we can update the teamSizePendingMove)
    virtual void undo_pending();	// Undo any pending changes (team membership unchanged)

    // Functions to determine the effect of changes to team membership - returns the delta cost
    // of just this move (ignoring other pending moves). Negative is better.
    virtual double pend_remove_member(Member* member) = 0;
    virtual double pend_add_member(Member* member) = 0;

    // For statistics purposes - percentage (0 to 100) of constraint satisfaction
    // (value will usually be 0 or 100 - except for minimise/maximise constraints)
    // (If the constraint does not apply to teams of this size then we return 100%)
    virtual double percent_constraint_met() = 0;

    // Factory
    static ConstraintCost* construct(const TeamLevel* team, const Constraint* constraint);
};

///////////////////////////////////////////////////////////////////////////////
// CountConstraintCost

// Costs of constraints which relate to counts of the number of members with certain properties
class CountConstraintCost : public ConstraintCost {
private:
    const int target;
    const int constraintNumber;

    int numMembersConsidered;
    int count;

    int numMembersPendingMove;
    int countPendingMove;
public:
    // Constructor
    CountConstraintCost(const TeamLevel* team, const Constraint* constraint);

    // Destructor
    ~CountConstraintCost();

private:
    void initialise();		// initalise
public:
    void evaluate();		// update pending cost based on current count, num members, target, constraint etc.
    void commit_pending();	// commit the pending move(s) - update count, numMembersConsidered, cost
    void undo_pending();
    double pend_remove_member(Member* member);
    double pend_add_member(Member* member);

    double percent_constraint_met();
};

///////////////////////////////////////////////////////////////////////////////
// SimilarityConstraintCost

// Costs of constraints which relate to string fields with same value 
class SimilarityConstraintCost : public ConstraintCost {
private:
    const Attribute* const attribute;
    const int numAttributeValues;

    vector<int> valueCount;	// Indexed by attribute string value index
    int countDistinctValues;
    int numMembersConsidered;

    vector<int> valueCountPendingMove;
    vector<int> valueCountsToUpdate;		// records index of value counts that are different 
    						// between the committed and pending arrays
    int countDistinctValuesPendingMove;
    int numMembersPendingMove;

public:
    // Constructor
    SimilarityConstraintCost(const TeamLevel* team, const Constraint* constraint);

    // Destructor
    ~SimilarityConstraintCost();

private:
    void initialise();		// intialise
public:
    void evaluate();		// update pending cost based on current data
    void commit_pending();	// commit the pending move(s) - update member variables
    void undo_pending();
    double pend_remove_member(Member* member);
    double pend_add_member(Member* member);

    double percent_constraint_met();
};

///////////////////////////////////////////////////////////////////////////////
// RangeConstraintCost

// Costs of constraints which relate to string fields with same value 
class RangeConstraintCost : public ConstraintCost {
private:
    const Attribute* const attribute;
    double attributeValueRange;
    
    /*
    double minValue;
    double maxValue;
    */
    double sumOfValues;
    double sumOfSquareValues;
    int numMembersConsidered;

    /*
    double minValuePendingMove;
    double maxValuePendingMove;
    */
    double sumOfValuesPendingMove;
    double sumOfSquareValuesPendingMove;
    int numMembersPendingMove;
public:
    // Constructor
    RangeConstraintCost(const TeamLevel* team, const Constraint* constraint);

    // Destructor
    ~RangeConstraintCost();

private:
    void initialise();
public:
    void evaluate();		// update pending cost based on current data
    void commit_pending();
    void undo_pending();
    double pend_remove_member(Member* member);
    double pend_add_member(Member* member);

    double percent_constraint_met();

    double std_dev();	// return standard deviation of values in this team - pending moves
    //double range();	// return range of values in this team - pending moves
};

#endif

