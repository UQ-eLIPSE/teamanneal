//
// moveSet.hh
//

#ifndef MOVESET_HH
#define MOVESET_HH

#include <array>
#include <random>
#include "entity.hh"
#include "cost.hh"

class MoveSet;
class AnnealThread;

///////////////////////////////////////////////////////////////////////////////
// AnnealMove
class AnnealMove {
protected:
    MoveSet* moveSet;
    Partition* partition;
    CostData* costData;
    bool lastMoveAccepted;
public:
    // Constructor
    AnnealMove(MoveSet* moveSet, Partition* partition, CostData* costData);

    // Returns deltaCost
    virtual double generate_and_evaluate_random_move(double temperature) = 0;
    bool accepted();
};

///////////////////////////////////////////////////////////////////////////////
// MoveMember
class MoveMember : public AnnealMove {
public:
    // Constructor
    MoveMember(MoveSet* moveSet, Partition* partition, CostData* costData);

    double generate_and_evaluate_random_move(double temperature);
};

///////////////////////////////////////////////////////////////////////////////
// SwapMembers
class SwapMembers : public AnnealMove {
public:
    // Constructor
    SwapMembers(MoveSet* moveSet, Partition* partition, CostData* costData);

    double generate_and_evaluate_random_move(double temperature);
};

///////////////////////////////////////////////////////////////////////////////
// MoveSet
class MoveSet {
public:
    typedef enum {SWAP, MOVE} Type;
private:
    Partition* partition;
    CostData* costData;
    double temperature;
    double lowestCost;

    static array<double,2> moveProbabilities;
    mt19937 randomNumberGenerator;
    discrete_distribution<int> moveDistribution;
    uniform_real_distribution<double> uniform0to1Distribution;
    array<AnnealMove*,2> moves;

private:	// Statistics related
    double sumAcceptedUphillCosts;
    int numUphillMovesAccepted;
    int numUphillMovesRejected;
public:
    function<int()> moveDice;
    function<double()> random0to1Dice;
public:
    // Constructor
    MoveSet(Partition* partition, CostData* costData);
    AnnealMove* get_random_move_type();
    // Undertake the initial loop (all moves accepted) and set the initial temperature
    void initial_loop();
    // Returns number of iterations which resulted in moves being accepted
    int anneal_inner_loop(int iterations);

    void reduce_temperature();

    // Undertake the anneal
    void do_anneal(AnnealThread* thread);

    // Statistics functions. Statistics should be reset before every inner/initial loop
    void reset_stats();
    void log_cost(double deltaCost, bool accepted);
    // Since stats were reset - return the probability that uphill moves were accepted
    double uphill_probability();

    // Check if the current cost is the lowest and if so, record it and keep a copy of that
    // team membership
    void check_for_lowest_cost();

    //
};

#endif
