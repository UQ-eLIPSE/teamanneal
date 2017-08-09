import * as UUID from "../util/UUID";
import { transpose } from "../util/Array";

export interface MinimalDescriptor {
    _id: string,

    label: string,
    type: "number" | "string",
}

export interface Data extends MinimalDescriptor {
    /**
     * The `null` value that can be stored here is actually representing
     * `undefined`. This is because JSON objects can't actually store the
     * undefined literal, and only supports `null`.
     */
    rawColumnValues: ReadonlyArray<string | null>,
}

interface NumericStats {
    min: number,
    max: number,
    range: number,
}

export namespace ColumnData {
    /** Holds the value sets for ColumnData objects */
    const ValueSets =
        {
            number: new WeakMap<Data, Set<number>>(),
            string: new WeakMap<Data, Set<string>>(),
        };

    /** Holds numeric stats for numeric ColumnData objects */
    const NumericStats = new WeakMap<Data, NumericStats>();

    /** Holds cooked column values for ColumnData objects */
    const CookedColumnValues =
        {
            number: new WeakMap<Data, ReadonlyArray<number | null>>(),
            string: new WeakMap<Data, ReadonlyArray<string | null>>(),
        }

    export function Init(
        rawColumnValues: ReadonlyArray<string | undefined | null>,
        label: string,
        type?: "number" | "string",
    ) {
        // We need to convert any column values which are `undefined` into 
        // `null` because internally ColumnData only supports `null` due to
        // the translation to/from JSON
        const columnValues = rawColumnValues.map(x => x === undefined ? null : x);

        // Detect the type if not provided
        if (type === undefined) {
            // Detect type and overwrite input value of `undefined`
            type = DetectColumnType(columnValues);

            // If type is still undefined, just say it's a string
            if (type === undefined) {
                type = "string";
            }
        }

        const data: Data = {
            _id: UUID.generate(),
            label,
            type,
            rawColumnValues: columnValues,
        };

        return data;
    }

    export function GenerateValueSet(columnData: Data) {
        // Get cooked column value data
        const cookedColumnValues = GetCookedColumnValues(columnData);

        // Detect type
        switch (columnData.type) {
            case "number": {
                // Strip out all `null` values before placing them into 
                // number set
                const numberValues =
                    (cookedColumnValues as ReadonlyArray<number | null>).filter(x => x !== null) as ReadonlyArray<number>;

                return new Set<number>(numberValues);
            }

            case "string": {
                // Strip out all `null` values before placing them into 
                // string set
                const stringValues =
                    (cookedColumnValues as ReadonlyArray<string | null>).filter(x => x !== null) as ReadonlyArray<string>;

                return new Set<string>(stringValues);
            }
        }

        throw new Error("Unknown column type");
    }

    export function GetValueSet(columnData: Data) {
        const columnType = columnData.type;

        let valueSet = ValueSets[columnType].get(columnData);

        // If existing value set does not exist, generate and store in cache
        if (valueSet === undefined) {
            const newValueSet = GenerateValueSet(columnData);
            valueSet = newValueSet;
            (ValueSets[columnType] as WeakMap<Data, Set<number | string>>).set(columnData, valueSet);
        }

        return valueSet;
    }

    export function GenerateNumericStats(columnData: Data) {
        if (columnData.type !== "number") {
            throw new Error("Numeric statistics only available with numeric columns");
        }

        // Get the numeric value set
        const valueSet = GetValueSet(columnData) as Set<number>;

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

    export function GetNumericStats(columnData: Data) {
        let stats = NumericStats.get(columnData);

        // If existing stats do not exist, generate and store in cache
        if (stats === undefined) {
            const newStats = ColumnData.GenerateNumericStats(columnData);
            stats = newStats;
            NumericStats.set(columnData, stats);
        }

        return stats;
    }

    export function GenerateCookedColumnValues(columnData: Data) {
        switch (columnData.type) {
            case "number": {
                // Convert values into numbers
                return columnData.rawColumnValues.map((value) => {
                    // If null or empty string, convert to null
                    if (value === null || value.trim().length === 0) {
                        return null;
                    }

                    // Convert everything else to a number
                    // NOTE: This may produce NaN, and converts number-like 
                    // values under ECMAScript rules (e.g. "0xF" => 15)
                    return +value;
                });
            }

            case "string": {
                // Simply return the raw column values as-is
                return columnData.rawColumnValues;
            }
        }

        throw new Error("Unknown column type");
    }

    export function GetCookedColumnValues(columnData: Data) {
        const columnType = columnData.type;

        let cookedColumnValues = CookedColumnValues[columnType].get(columnData);

        // If existing cooked column values do not exist, generate and store in 
        // cache
        if (cookedColumnValues === undefined) {
            const newCookedColumnValues = GenerateCookedColumnValues(columnData);
            cookedColumnValues = newCookedColumnValues;
            (CookedColumnValues[columnType] as WeakMap<Data, ReadonlyArray<string | number | null>>).set(columnData, cookedColumnValues);
        }

        return cookedColumnValues;
    }

    export function DetectColumnType(rawColumnValues: ReadonlyArray<string | null>) {
        // Keep track of type (start of with number) and emptiness
        let isNumber = true;
        let isEmpty = true;

        // Go through all values
        for (let i = 0; i < rawColumnValues.length; ++i) {
            const rawValue = rawColumnValues[i];

            // If null or string is blank, skip
            if (rawValue === null || rawValue.length === 0) {
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

    export function ConvertToMinimalDescriptor({ _id, label, type }: Data) {
        const columnDescriptor: MinimalDescriptor = {
            _id,
            label,
            type,
        }

        return columnDescriptor;
    }

    export function ConvertToDataObject(columns: ReadonlyArray<Data>, columnDescriptor: MinimalDescriptor) {
        return columns.find(c => Equals(columnDescriptor, c));
    }

    export function Equals(a: MinimalDescriptor, b: MinimalDescriptor) {
        return a._id === b._id;
    }

    export function TransposeIntoRawValueRowArray(columns: ReadonlyArray<Data>, includeLabel: boolean = false) {
        const columnValues = columns.map((column) => {
            if (includeLabel) {
                return [column.label, ...column.rawColumnValues];
            }

            return [...column.rawColumnValues];
        });

        return transpose(columnValues);
    }

    export function TransposeIntoCookedValueRowArray(columns: ReadonlyArray<Data>, includeLabel: boolean = false) {
        const columnValues = columns.map((column) => {
            if (includeLabel) {
                return [column.label, ...GetCookedColumnValues(column)];
            }

            return [...GetCookedColumnValues(column)];
        });

        return transpose(columnValues);
    }
}
