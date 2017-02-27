import * as Config from "./Config";
import * as SourceRecord from "./SourceRecord";

import * as Random from "./Random";
import * as Util from "./Util";







export type Set = ReadonlyArray<Group>;

export interface Group {
    readonly name: string,
    readonly records: SourceRecord.Set,
}

export type NamingFunction = (i: number) => string;





export const getRecordsOfGroup =
    (group: Group) =>
        group.records;

export const getSizeOfGroup =
    (group: Group) =>
        getRecordsOfGroup(group).length;

export const getRandomRecordIndex =
    (group: Group) => {
        const size = getSizeOfGroup(group);

        if (!size) {
            throw new Error("No records in Group");
        }

        return Random.generateRandomIntTo(size);
    }

export const extractRandomRecord =
    (group: Group) => {
        const randomIndex = getRandomRecordIndex(group);
        const records = getRecordsOfGroup(group);

        return SourceRecord.getIthRecord(records)(randomIndex);
    }

export const popRandomRecord =
    (group: Group) => {
        const randomIndex = getRandomRecordIndex(group);

        return popRecord(group)(randomIndex);
    }

export const popRecord =
    (group: Group) =>
        (i: number) => {
            const records = Util.copyArray(getRecordsOfGroup(group));

            // Pop selected record out
            const popped = records.splice(i, 1)[0];

            // Create new group with new record array
            const newGroup = formGroupFromRecords(group.name)(records);

            return {
                popped,
                group: newGroup
            };
        }

export const insertRecord =
    (group: Group) =>
        (record: SourceRecord.Record) => {
            const records = Util.copyArray(getRecordsOfGroup(group));
            records.push(record);

            // Create new group with new record array
            const newGroup = formGroupFromRecords(group.name)(records);

            return newGroup;
        }

export const generateBlankGroupRecordArrays =
    (numberOfGroups: number) => {
        const groupRecords: SourceRecord.Record[][] = [];
        Util.repeat(() => groupRecords.push([]))(numberOfGroups);

        return groupRecords;
    }

export const generateGroupRecordArrays =
    (numberOfGroups: number) =>
        (records: SourceRecord.Set) => {
            // Copy records into mutable array
            const recordsCopy = Util.copyArray(records);

            // Set up groups, prepopulate with blanks
            const groupRecords = generateBlankGroupRecordArrays(numberOfGroups);

            // Generate records to be placed into groups
            let groupIndex = 0;
            while (recordsCopy.length) {
                // Pick random record
                const recordIndex = Random.generateRandomIntTo(recordsCopy.length);

                // Move record
                const record = recordsCopy.splice(recordIndex, 1)[0];
                groupRecords[groupIndex].push(record);

                // Next group please
                groupIndex = (groupIndex + 1) % numberOfGroups;
            }

            return groupRecords;
        }

export const generateGroups =
    (level: Config.Level) =>
        (nameFunc: NamingFunction) =>
            (records: SourceRecord.Set) => {
                const numberOfGroups = calculateNumberOfGroups(records.length)(level.size.min)(level.size.ideal)(level.size.max)(false);

                return generateGroupRecordArrays(numberOfGroups)(records).map(
                    (groupRecords, i) => formGroupFromRecords(nameFunc(i))(groupRecords)
                );
            }

export const formGroupFromRecords =
    (name: string) =>
        (records: SourceRecord.Set) => {
            const group: Group = {
                name,
                records,
            }

            return group;
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
