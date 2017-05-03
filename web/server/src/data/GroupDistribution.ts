import * as Util from "../core/Util";

/**
 * Slices array of items into specified number of groups.
 * No shuffling is provided.
 */
export function sliceIntoGroups<T>(numberOfGroups: number, items: ReadonlyArray<T>) {
    const groups: ReadonlyArray<T>[] = [];
    const minGroupSize = Util.uint32(items.length / numberOfGroups);
    let leftOver = items.length % numberOfGroups;

    let start: number = 0;
    let end: number;

    for (let i = 0; i < numberOfGroups; ++i) {
        // Set `end` to encompass the minimum group size
        end = start + minGroupSize;

        // If there are left overs, add one in to this group
        if (leftOver > 0) {
            ++end;
            --leftOver;
        }

        // Push slice of items into `groups`
        groups.push(items.slice(start, end));

        // Update `start` of next round
        start = end;
    }

    return groups;
}

/**
 * Calculates the number of groups that should be formed.
 * 
 * Extracted from original TeamAnneal, AllTeamData::number_of_teams.
 */
export function calculateNumberOfGroups(numMembers: number, minSize: number, idealSize: number, maxSize: number, favourSmaller: boolean) {
    // Default value for numTeams may get adjusted as we go
    let numTeams = Util.uint32(numMembers / idealSize); // number of ideal size teams
    const numLeftOver = numMembers % idealSize;	        // number of people left over

    if (numLeftOver == 0) {
        // All teams can be ideal size 
    } else if (minSize == idealSize && idealSize == maxSize) {
        // overconstrained - throw Exception
        throw new Error("Not all teams can be the ideal size");
    } else if (minSize == idealSize && idealSize < maxSize) {
        // Teams can be larger than ideal but not smaller. Excess members
        // will get distributed amongst existing teams
    } else if (minSize < idealSize && idealSize == maxSize) {
        // Teams can be smaller but not larger. We'll need one additional team
        // to hold our excess members + some taken from other teams
        numTeams++;
    } else {
        // Possibly underconstrained - we can have larger or smaller teams. We
        // favour minimising the number of non-ideal teams and making sizes as 
        // close to ideal as possible (plus or minus 1). NOTE: We ignore the 
        // possibility of teams being more than 1 different from the ideal
        if (idealSize % 2 == 0 && numLeftOver == (idealSize / 2)) {
            //We have exactly half a team left over - we could go smaller or larger
            if (favourSmaller && ((minSize - numLeftOver) <= numTeams)) {
                // We can extract one from each of other teams to make up the difference
                numTeams++;
            } else if (numMembers > numTeams * maxSize) {
                // Can't fit everyone in maximum size teams - try adding one more team
                numTeams++;
            } else {
                // go larger - Excess team members will get distributed amongst
                // existing teams
            }
        } else if (numLeftOver > (idealSize / 2) && ((minSize - numLeftOver) <= numTeams)) {
            // We have more than half a team worth of members left over and we have enough teams
            // to take one member each from - favour making teams smaller
            numTeams++;
        } else if (numMembers > numTeams * maxSize) {
            // Can't fit everyone in maximum size teams - try adding one more
            numTeams++;
        } else {
            // Favour making teams larger - left over team members distributed 
            // amongst other teams
        }
    }
    if (numMembers < numTeams * minSize || numMembers > numTeams * maxSize) {
        // We can't make this work - throw an exception to indicate error
        throw new Error("Can't meet team size contraints");
    }
    return numTeams;
}
