import { AnnealCreator as S } from "../store";

export function setMutation() {
    // Only mutate is imported and not mutated
    if (S.get(S.getter.HAS_IMPORT) && (!S.get(S.getter.HAS_MUTATED))) {
        S.dispatch(S.action.SET_MUTATION_FLAG_HIGH, undefined);
    }
}