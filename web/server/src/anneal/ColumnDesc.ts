/*
 * ColumnInfo
 * 
 * 
 */
import * as StringMap from "./StringMap";
import * as Util from "./Util";



export interface ColumnDesc extends Array<number> {
    /// Standard
        /** name */     0: StringMap.StringPointer,
        /** type */     1: number,

    /// Number
        /** min */      2: number,
        /** max */      3: number,

    /// String
        /** distinct */ 4: number,
}

export const __size: number = 5;

// TODO: Why doesn't TypeScript associate number[] to ColumnDesc?
const __seed: ColumnDesc = Util.initArray(NaN)(__size) as any;







const __getter = <T>(i: number) => (d: ColumnDesc): T => (d as any)[i];
const __setter = <T>(i: number) => (d: ColumnDesc) => (val: T): T => (d as any)[i] = val;

export const getName = __getter<StringMap.StringPointer>(0);
export const getType = __getter<number>(1);
export const getRangeMin = __getter<number>(2);
export const getRangeMax = __getter<number>(3);
export const getStringDistinct = __getter<number>(4);

export const setName = __setter<StringMap.StringPointer>(0);
       const setType = __setter<number>(1);
export const setRangeMin = __setter<number>(2);
export const setRangeMax = __setter<number>(3);
export const setStringDistinct = __setter<number>(4);

export const init =
    (): ColumnDesc => {
        // Copy seed array
        return __seed.slice() as any;
    }

export const isNumeric =
    (desc: ColumnDesc) => getType(desc) === 0;

export const isString =
    (desc: ColumnDesc) => getType(desc) === 1;



export const isTypeSet =
    (desc: ColumnDesc) => !Util.isNaN(getType(desc));

export const setTypeNumeric =
    (desc: ColumnDesc) => setType(desc)(0);

export const setTypeString =
    (desc: ColumnDesc) => setType(desc)(1);



export const getRange =
    (desc: ColumnDesc) => getRangeMax(desc) - getRangeMin(desc);
