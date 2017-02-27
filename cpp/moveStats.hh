//
// moveStats.hh
//

#ifndef MOVESTATS_HH
#define MOVESTATS_HH

#include "teamData.hh"
#include "entity.hh"
#include <ostream>

using namespace std;

void calculate_move_stats(AllTeamData* data, const Person* person);
void output_move_stats(ostream& os);

#endif
