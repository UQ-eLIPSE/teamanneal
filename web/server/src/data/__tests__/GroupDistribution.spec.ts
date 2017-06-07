import * as GroupDistribution from "../GroupDistribution";

describe("`sliceIntoGroups`", () => {
    test("slice test (groups = 5; items = 10)", () => {
        const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const numberOfGroups = 5;
        const groups = GroupDistribution.sliceIntoGroups(numberOfGroups, items);

        // 5 groups
        expect(groups).toHaveLength(5);

        // Each group => size 2
        groups.forEach((group) => {
            expect(group).toHaveLength(2);
        });
    });

    test("slice test (groups = 4; items = 10)", () => {
        const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const numberOfGroups = 4;
        const groups = GroupDistribution.sliceIntoGroups(numberOfGroups, items);

        // 4 groups
        expect(groups).toHaveLength(4);

        // Group sizes are expected to have left overs assigned in the earlier
        // groups
        expect(groups[0]).toHaveLength(3);
        expect(groups[1]).toHaveLength(3);
        expect(groups[2]).toHaveLength(2);
        expect(groups[3]).toHaveLength(2);
    });

    test("slice test (groups = 12; items = 10)", () => {
        const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const numberOfGroups = 12;
        const groups = GroupDistribution.sliceIntoGroups(numberOfGroups, items);

        // 12 groups
        expect(groups).toHaveLength(12);

        // Groups 1 - 10 have size 1; Groups 11, 12 have size 0.
        groups.forEach((group, i) => {
            if (i >= 10) {  // Group 11, 12
                return expect(group).toHaveLength(0);
            }

            // Others
            expect(group).toHaveLength(1);
        });
    });
});
