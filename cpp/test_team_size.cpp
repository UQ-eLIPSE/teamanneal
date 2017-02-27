#include "teamData.hh"
#include <stdio.h>

int main(int argc, char* argv[]) {
    for(int min = 3; min <= 4; min++) {
	for (int ideal=min; ideal <= 6; ideal++) {
	    for(int max=ideal; max <= 7; max++) {
		for(int n=2; n<= 20; n++) {
		    printf("%2d %2d %2d : %2d ",  min, ideal, max, n);
		    try {
			int teams1 = AllTeamData::number_of_teams(n, min, ideal, max, false);
			printf("%2d ", teams1);
			int teams2 = AllTeamData::number_of_teams(n, min, ideal, max, true);
			printf("%2d", teams2);
			if(teams1 != teams2) {
			    printf("*");
			}
		    } catch(const char* mesg) {
			printf("%s", mesg);
		    }
		    printf("\n");
		}
	    }
	}
    }
}
