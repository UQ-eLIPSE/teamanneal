/*
 * Partition
 * 
 * Represents a set of groups ("SourceRecordSet.Set").
 */
import * as SourceRecordSet from "./SourceRecordSet";
import * as Util from "./Util";

export interface Partition extends Array<SourceRecordSet.SourceRecordSet> { };





export const init =
    (): Partition => {
        return [];
    }

export const initWith =
    (set: SourceRecordSet.SourceRecordSet) =>
        (minSize: number) =>
            (idealSize: number) =>
                (maxSize: number) => {
                    const numberOfGroups = calculateNumberOfGroups(SourceRecordSet.size(set))(minSize)(idealSize)(maxSize)(false);

                    const partition: Partition = Util.initArrayFunc(_ => [])(numberOfGroups);

                    set.forEach((record, i) => {
                        (get(partition)(i % numberOfGroups) as SourceRecordSet.SourceRecordSet).push(record);
                    });

                    return partition;
                }

export const get =
    (partition: Partition) =>
        (i: number) => {
            return partition[i];
        }

export const set =
    (partition: Partition) =>
        (i: number) =>
            (set: SourceRecordSet.SourceRecordSet) => {
                return partition[i] = set;
            }

export const size =
    (partition: Partition) => {
        return partition.length;
    }

/**
 * Calculates the number of groups that should be formed.
 * 
 * Extracted from original TeamAnneal, AllTeamData::number_of_teams.
 */
export const calculateNumberOfGroups =
    (numMembers: number) =>
        (minSize: number) =>
            (idealSize: number) =>
                (maxSize: number) =>
                    (favourSmaller: boolean) => {
                        // Default value for numTeams may get adjusted as we go
                        let numTeams = Util.uint32(numMembers / idealSize);	// number of ideal size teams
                        const numLeftOver = numMembers % idealSize;	// number of people left over

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
