interface _MutationTracker {
    mutationFlag: boolean,
    importFlag: boolean
}

export type MutationTracker = _MutationTracker

export function init(mutationFlag: boolean = false, importFlag: boolean = false) {
    const obj: MutationTracker = {
        mutationFlag,
        importFlag
    };

    return obj;
}
