/**
 * Calculates the number of groups that should be formed.
 * 
 * Extracted from original TeamAnneal, AllTeamData::number_of_teams.
 */
export function calculateNumberOfGroups(numMembers: number, minSize: number, idealSize: number, maxSize: number, favourSmaller: boolean) {
    // Default value for numTeams may get adjusted as we go
    let numTeams = (numMembers / idealSize) >>> 0;      // number of ideal size teams
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

/**
 * Generates array where each element represents the number of children of a
 * group.
 */
export function generateGroupSizes(numMembers: number, minSize: number, idealSize: number, maxSize: number, favourSmaller: boolean) {
    // Calculate number of groups to form
    const numberOfGroups = calculateNumberOfGroups(numMembers, minSize, idealSize, maxSize, favourSmaller);

    const minGroupSize = (numMembers / numberOfGroups) >>> 0;
    let leftOver = numMembers % numberOfGroups;

    // Go through each group and append size value into array
    const groupSizeArray: number[] = [];

    for (let i = 0; i < numberOfGroups; ++i) {
        let groupSize = minGroupSize;

        // If there are left overs, add one in to this group
        if (leftOver > 0) {
            ++groupSize;
            --leftOver;
        }

        groupSizeArray.push(groupSize);
    }

    return groupSizeArray;
}
