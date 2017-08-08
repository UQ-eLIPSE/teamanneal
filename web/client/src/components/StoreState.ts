import * as store from "../store";

import { Vue, Trait } from "av-ts";

import { Data as IState } from "../data/State";

@Trait
export class StoreState extends Vue {
    /** Returns the general Vuex-stored state with the appropriate interface */
    get state() {
        return this.$store.state as IState;
    }
}

// To satisfy TypeScript's "noUnusedLocals" check, we reference "store" at
// least once by doing a no-op expression
store;
