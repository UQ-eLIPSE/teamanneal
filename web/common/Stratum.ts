export interface Desc {
    /** Label */
    readonly label: string,
    /** Size allocation */
    readonly size: {
        /** Absolute minimum strata group size */
        readonly min: number,
        /** Desired strata group size */
        readonly ideal: number,
        /** Absolute maximum strata group size */
        readonly max: number,
    }
}
