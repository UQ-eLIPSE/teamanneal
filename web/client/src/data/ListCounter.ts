export type ListCounterType =
    "decimal" |
    "decimal-leading-zero" |
    "decimal-index-zero" |
    "decimal-index-zero-leading-zero" |
    "lower-latin" |
    "upper-latin";

export interface ListCounter {
    type: ListCounterType,
    description: string,
    example: string,
    generator: (length: number) => ReadonlyArray<string>,
}

export namespace Decimal {
    export function Generate(length: number): ReadonlyArray<string> {
        const arr: string[] = [];

        for (let i = 1; i <= length; ++i) {
            arr.push('' + i);
        }

        return arr;
    }
}

export namespace DecimalLeadingZero {
    export function Generate(length: number): ReadonlyArray<string> {
        const arr: string[] = [];

        // Determine maximal string length
        const maxStrLen = ('' + length).length;

        for (let i = 1; i <= length; ++i) {
            let str = '' + i;

            // Pad the string
            for (let j = str.length; j < maxStrLen; ++j) {
                str = "0" + str;
            }

            arr.push(str);
        }

        return arr;
    }
}

export namespace DecimalIndexZero {
    export function Generate(length: number): ReadonlyArray<string> {
        const arr: string[] = [];

        for (let i = 0; i < length; ++i) {
            arr.push('' + i);
        }

        return arr;
    }
}

export namespace DecimalIndexZeroLeadingZero {
    export function Generate(length: number): ReadonlyArray<string> {
        const arr: string[] = [];

        // Determine maximal string length
        const maxStrLen = ('' + (length - 1)).length;

        for (let i = 0; i < length; ++i) {
            let str = '' + i;

            // Pad the string
            for (let j = str.length; j < maxStrLen; ++j) {
                str = "0" + str;
            }

            arr.push(str);
        }

        return arr;
    }
}

export namespace Base26 {
    /**
     * Generates an array of specified length with base 26 number arrays 
     * monotonically increasing from 0.
     */
    export function Generate(length: number): ReadonlyArray<ReadonlyArray<number>> {
        const arr: number[][] = [];

        for (let i = 1; i <= length; ++i) {
            // Based off https://github.com/alexfeseto/hexavigesimal
            let n = i;                          // Working number
            let thisNumArr: number[] = [];      // Number to be built up

            while (n > 0) {
                --n;
                thisNumArr.unshift(n % 26);     // Insert at start of number array
                n = (n / 26) >>> 0;             // Integer divide by 26
            }

            arr.push(thisNumArr);
        }

        return arr;
    }
}

export namespace LowerLatin {
    const startCharCode = 97;       // "a"

    export function Generate(length: number): ReadonlyArray<string> {
        return Base26.Generate(length).map((numArr) => {
            return numArr.map((base26Number) => {
                return String.fromCharCode(startCharCode + base26Number);
            }).join("");
        });
    }
}

export namespace UpperLatin {
    const startCharCode = 65;       // "A"

    export function Generate(length: number): ReadonlyArray<string> {
        return Base26.Generate(length).map((numArr) => {
            return numArr.map((base26Number) => {
                return String.fromCharCode(startCharCode + base26Number);
            }).join("");
        });
    }
}

// These are the available naming conventions
// The description and naming are based on CSS counter styles:
// https://drafts.csswg.org/css-counter-styles-3/#predefined-counters
export const SupportedListCounters: ReadonlyArray<ListCounter> = [
    {
        type: "decimal",
        description: "Decimal numbers, beginning with 1",
        example: "1, 2, 3, ...",
        generator: Decimal.Generate,
    },
    {
        type: "decimal-leading-zero",
        description: "Decimal numbers padded with leading zeros, beginning with 1",
        example: "01, 02, 03, ...",
        generator: DecimalLeadingZero.Generate,
    },
    {
        type: "decimal-index-zero",
        description: "Decimal numbers, beginning with 0",
        example: "0, 1, 2, ...",
        generator: DecimalIndexZero.Generate,
    },
    {
        type: "decimal-index-zero-leading-zero",
        description: "Decimal numbers padded with leading zeros, beginning with 0",
        example: "00, 01, 02, ...",
        generator: DecimalIndexZeroLeadingZero.Generate,
    },
    {
        type: "lower-latin",
        description: "Lowercase Latin letters",
        example: "a, b, c, ...",
        generator: LowerLatin.Generate,
    },
    {
        type: "upper-latin",
        description: "Uppercase Latin letters",
        example: "A, B, C, ...",
        generator: UpperLatin.Generate,
    },
];
