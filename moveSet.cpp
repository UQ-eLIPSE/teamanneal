//
// moveSet.cpp
//

#include "moveSet.hh"
#include <ctime>
#include <cmath>
#include "assert.h"
#include <algorithm>

///////////////////////////////////////////////////////////////////////////////
// static member definition
array<double,2> MoveSet::moveProbabilities = {{0.9, 0.1}};

///////////////////////////////////////////////////////////////////////////////
// AnnealMove

// Constructor
AnnealMove::AnnealMove(MoveSet* moveSet, Partition* partition, CostData* costData) :
	moveSet(moveSet),
	partition(partition),
	costData(costData),
	lastMoveAccepted(false)
{
}

bool AnnealMove::accepted()
{
    return lastMoveAccepted;
}

///////////////////////////////////////////////////////////////////////////////
// MoveMember

// Constructor
MoveMember::MoveMember(MoveSet* moveSet, Partition* partition, CostData* costData) :
	AnnealMove(moveSet, partition, costData)
{
}

double MoveMember::generate_and_evaluate_random_move(double temperature)
{
    //cout << "Move Member - doing nothing " << endl;
    return 0.0;
}

///////////////////////////////////////////////////////////////////////////////
// SwapMembers

// Constructor
SwapMembers::SwapMembers(MoveSet* moveSet, Partition* partition, CostData* costData) :
	AnnealMove(moveSet, partition, costData)
{
    assert(partition->num_teams_at_lowest_level() > 1);	// Number of subteams must be more than one
}

double SwapMembers::generate_and_evaluate_random_move(double temperature)
{
    Member *member1, *member2;
    member1 = partition->get_random_member();
    do {
	member2 = partition->get_random_member();
    } while (member1->get_parent() == member2->get_parent());
    //cout << "Swapping " << member1->get_id() << " and " << member2->get_id() << ": ";
    // Now have two members in different teams
    TeamLevel* team1 = member1->get_parent();
    TeamLevel* team2 = member2->get_parent();

    double deltaCost = costData->pend_remove_member(member1);
    deltaCost += costData->pend_remove_member(member2);
    deltaCost += costData->pend_add_member(member1, team2);
    deltaCost += costData->pend_add_member(member2, team1);


    if(deltaCost > 0 && temperature > 0) {
	// Move makes things worse - accept with probability related to temperature
	double acceptProbability = exp(- deltaCost / temperature);
	if(moveSet->random0to1Dice() > acceptProbability) {
	    // Don't accept the move
	    lastMoveAccepted = false;
	    moveSet->log_cost(deltaCost, lastMoveAccepted);
	    costData->undo_pending();
	    //cout << "no" << endl;
	    return deltaCost;
	}
    }
    //cout << "yes (" << deltaCost << ")" << endl;
    // If we get here, we accept the move
    lastMoveAccepted = true;
    moveSet->log_cost(deltaCost, lastMoveAccepted);
    // Update team memberships
    partition->remove_member_from_lowest_level_team(member1);
    partition->remove_member_from_lowest_level_team(member2);
    partition->add_member_to_lowest_level_team(member1, team2);
    partition->add_member_to_lowest_level_team(member2, team1);
    // Update costs
    costData->commit_pending();
    moveSet->check_for_lowest_cost();
    return deltaCost;
}

///////////////////////////////////////////////////////////////////////////////
// MoveSet

// Constructor
MoveSet::MoveSet(Partition* partition, CostData* costData) :
	partition(partition),
	costData(costData),
	temperature(0.0),
	lowestCost(costData->get_cost_value()),
	//randomNumberGenerator(0),
	randomNumberGenerator(time(nullptr)), 	// Seed RN generator with current time
	moveDistribution(moveProbabilities.begin(), moveProbabilities.end()),
	uniform0to1Distribution(0.0, 1.0),
	moveDice(bind(moveDistribution, randomNumberGenerator)),
	random0to1Dice(bind(uniform0to1Distribution, randomNumberGenerator))
{
    moves[0] = new SwapMembers(this, partition, costData);
    moves[1] = new MoveMember(this, partition, costData);
}

AnnealMove* MoveSet::get_random_move_type()
{
    int randomMoveID = moveDice();
    return moves[randomMoveID];
}

void MoveSet::initial_loop()
{
    temperature = 0.0;	// Ensure all moves are accepted
    reset_stats();
    // We gather our own stats in this loop also
    vector<double> uphillCosts;
    const int numUphillMovesToLookFor = 200;
    uphillCosts.reserve(numUphillMovesToLookFor);
    while(uphillCosts.size() < numUphillMovesToLookFor) {
        AnnealMove* move = this->get_random_move_type();
        double deltaCost = move->generate_and_evaluate_random_move(temperature);
	if(deltaCost > 0) {
	    uphillCosts.push_back(deltaCost);
	}
    }
    // Now have a set of uphill moves - sort them and work out the 90% point
    sort(uphillCosts.begin(), uphillCosts.end());
    double costAt90Percent = uphillCosts[numUphillMovesToLookFor * 9 / 10];

    // We want the probability of accepting moves of this cost to be 70%
    temperature = - costAt90Percent / log(0.7);

    cout << endl << "Completed initial toop - setting temperature to " << temperature << endl;
    cout << "Cost at 90 percent = " << costAt90Percent << endl;
}

int MoveSet::anneal_inner_loop(int iterations)
{
    reset_stats();
    costData->initialise_constraint_costs();
    int movesAccepted = 0;
    for(int i=0; i < iterations; i++) {
        AnnealMove* move = this->get_random_move_type();
        move->generate_and_evaluate_random_move(temperature);
        if(move->accepted()) {
            movesAccepted++;
#ifdef RECALCULATE_COSTS_FROM_SCRATCH_TO_DOUBLE_CHECK
	    double cost1 = costData->get_cost_value();
	    // recalculate cost
	    costData->initialise_constraint_costs();
	    double cost2 = costData->get_cost_value();
	    assert(abs(cost1-cost2)/cost1 < 0.0000001);
#endif
	}
    }
    /*
    cout << endl << "Completed inner loop - accepted " << movesAccepted << " of "
            << iterations << " iterations. Uphill prob = " << uphill_probability() <<  endl << endl;
    */
    if(lowestCost < costData->get_cost_value()) {
	// reset to lowest cost teams found so far
	/*
	cout << "****** Lowest cost: " << lowestCost << " < " << costData->get_cost_value() 
		<< " - restoring" << endl;
	*/
	partition->restore_lowest_cost_teams();
	costData->initialise_constraint_costs();
	lowestCost = costData->get_cost_value();
	/*
	cout << "****** New cost: " << lowestCost << endl;
	*/
    }

    return movesAccepted;
}

void MoveSet::reduce_temperature()
{
        temperature *= 0.98;
}

void MoveSet::do_anneal()
{
    // Do some initial moves (accepting all by setting the temperature to be 0) 
    // to gather some statistics and work out an appropriate initial temperature
    initial_loop();

    int iterationsPerLoop = partition->num_members() * 4;
    for(int step = 0; step < 600; ++step) {
        anneal_inner_loop(iterationsPerLoop);
        if(uphill_probability() > 0.7 || uphill_probability() < 0.2) {
            iterationsPerLoop = partition->num_members() * 4;
        } else if(uphill_probability() > 0.6 || uphill_probability() < 0.3) {
            iterationsPerLoop = partition->num_members() * 8;
        } else {
            iterationsPerLoop = partition->num_members() * 32;
        }
        // Reduce temperature
	reduce_temperature();
	cout << endl;
	cout << "Cost: " << costData->get_cost_value() << endl;
	//cout << "Lowest cost: " << lowestCost << endl;
        cout << "Reducing temperature to " << temperature << endl << endl;
    }
}

void MoveSet::reset_stats()
{
    sumAcceptedUphillCosts = 0.0;
    numUphillMovesAccepted = 0;
    numUphillMovesRejected = 0;
}

void MoveSet::log_cost(double deltaCost, bool accepted)
{
    if(deltaCost > 0) {
	if(accepted) {
	    sumAcceptedUphillCosts += deltaCost;
	    ++numUphillMovesAccepted;
	} else {
	    ++numUphillMovesRejected;
	}
    }
}

double MoveSet::uphill_probability()
{
    if(numUphillMovesAccepted == 0) {
	return 0.0;
    } else {
	return 1.0 * numUphillMovesAccepted / (numUphillMovesAccepted + numUphillMovesRejected);
    }
}

void MoveSet::check_for_lowest_cost()
{
    if(costData->get_cost_value() < lowestCost) {
	lowestCost = costData->get_cost_value();
	partition->set_current_teams_as_lowest_cost();
    }
}
