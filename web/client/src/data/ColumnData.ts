import * as UUID from "../util/UUID";

export interface DehydratedData {
    _id: string,

    label: string,
    type: "number" | "string",

    /**
     * The `null` value that can be stored here is actually representing
     * `undefined`. This is because JSON objects can't actually store the
     * undefined literal, and only supports `null`.
     */
    rawColumnValues: (string | null)[],
}

interface NumericStats {
    min: number,
    max: number,
    range: number,
}

export class ColumnData {
    private _id: string = UUID.generate();

    public type: "number" | "string";
    public label: string;

    /**
     * Raw column values may contain `undefined` values because of missing row
     * elements (e.g. when the length of a row does not match up with other
     * rows/header)
     */
    private rawColumnValues: (string | undefined)[];

    /** Holds the value sets for ColumnData objects */
    private static ValueSets =
    {
        number: new WeakMap<ColumnData, Set<number>>(),
        string: new WeakMap<ColumnData, Set<string>>(),
    };

    /** Holds numeric stats for numeric ColumnData objects */
    private static NumericStats = new WeakMap<ColumnData, NumericStats>();





    public static Hydrate({ _id, type, label, rawColumnValues, }: DehydratedData) {
        const columnData =
            new ColumnData(
                // Translate all `null` values back into `undefined`
                rawColumnValues.map(x => x === null ? undefined : x),
                label,
                type,
            );

        // Restore internal ID
        columnData._id = _id;

        return columnData;
    }

    public static Dehydrate({ _id, type, label, rawColumnValues, }: ColumnData) {
        const dehydratedData: DehydratedData = {
            _id,
            label,
            type,

            // Translate all `undefined` values into `null` for 
            // serialisation/dehydration
            rawColumnValues: rawColumnValues.map(x => x === undefined ? null : x),
        };

        return dehydratedData;
    }

    public static GenerateValueSet(columnData: ColumnData) {
        // Detect type
        switch (columnData.type) {
            case "number": {
                const set = new Set<number>();

                columnData.rawColumnValues.forEach((value) => {
                    // If undefined or empty string, do not add to value set
                    if (value === undefined || value.trim().length === 0) {
                        return;
                    }

                    // Add value into set as number
                    return set.add(+value);
                });

                return set;
            }

            case "string": {
                // Strip out all `undefined` values before placing them into 
                // string set
                const stringValues = columnData.rawColumnValues.filter(x => x !== undefined) as string[];

                return new Set<string>(stringValues);
            }
        }

        throw new Error("Unknown column type");
    }

    public static GetValueSet(columnData: ColumnData) {
        const columnType = columnData.type;

        let valueSet = ColumnData.ValueSets[columnType].get(columnData);

        // If existing value set does not exist, generate and store in cache
        if (valueSet === undefined) {
            const newValueSet = ColumnData.GenerateValueSet(columnData);
            valueSet = newValueSet;
            (ColumnData.ValueSets[columnType] as WeakMap<ColumnData, Set<number | string>>).set(columnData, valueSet);
        }

        return valueSet;
    }

    public static GenerateNumericStats(columnData: ColumnData) {
        if (columnData.type !== "number") {
            throw new Error("Numeric statistics only available with numeric columns");
        }

        // Get the numeric value set
        const valueSet = ColumnData.GetValueSet(columnData) as Set<number>;

        // Get minimum, maximum
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        valueSet.forEach((value) => {
            if (value < min) {
                min = value;
            }

            if (value > max) {
                max = value;
            }
        });

        return {
            min,
            max,
            range: max - min,
        }
    }

    public static GetNumericStats(columnData: ColumnData) {
        let stats = ColumnData.NumericStats.get(columnData);

        // If existing stats do not exist, generate and store in cache
        if (stats === undefined) {
            const newStats = ColumnData.GenerateNumericStats(columnData);
            stats = newStats;
            ColumnData.NumericStats.set(columnData, stats);
        }

        return stats;
    }

    public static DetectColumnType(rawColumnValues: (string | undefined)[]) {
        // Keep track of type (start of with number) and emptiness
        let isNumber = true;
        let isEmpty = true;

        // Go through all values
        for (let i = 0; i < rawColumnValues.length; ++i) {
            const rawValue = rawColumnValues[i];

            // If undefined or string is blank, skip
            if (rawValue === undefined || rawValue.length === 0) {
                continue;
            }

            // We know that the column is now not empty
            isEmpty = false;

            // Attempt to parse raw value as number
            const rawValueAsNumber = +rawValue;

            // If not a number, then column is definitely string
            if (Number.isNaN(rawValueAsNumber)) {
                isNumber = false;
                break;
            }
        }

        // If column is empty, then we have nothing to base our judgement on
        if (isEmpty) {
            return undefined;
        }

        // Not number => is definitely of type "string"
        if (!isNumber) {
            return "string";
        }

        // Otherwise we believe it is a number
        return "number";
    }





    constructor(rawColumnValues: (string | undefined)[], label: string, type?: "number" | "string") {
        this.rawColumnValues = rawColumnValues;
        this.label = label;

        // Detect the type if not provided
        if (type === undefined) {
            type = ColumnData.DetectColumnType(rawColumnValues);

            // If type is still undefined, throw an error
            if (type === undefined) {
                throw new Error("Could not detect the type of the provided column values");
            }
        }

        this.type = type;
    }

    /** JSON.stringify() handler */
    toJSON() {
        return ColumnData.Dehydrate(this);
    }

    get id() {
        return this._id;
    }

    get valueSet() {
        return ColumnData.GetValueSet(this);
    }

    get numericStats() {
        return ColumnData.GetNumericStats(this);
    }
}
