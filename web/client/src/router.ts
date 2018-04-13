import Vue from "vue";
import { Store } from "vuex";
import VueRouter from "vue-router";

// Data
import { Data as IState } from "./data/State";
import * as WizardNavigationEntry from "./data/WizardNavigationEntry";
import * as AnnealProcessWizardEntries from "./data/AnnealProcessWizardEntries";

// Subcomponents
import Welcome from "./components/Welcome.vue";
import AnnealProcess from "./components/AnnealProcess.vue";
import ResultsEditor from "./components/ResultsEditor.vue";

import Anneal_ProvideRecordsFile from "./components/anneal-wizard-panels/ProvideRecordsFile.vue";
import Anneal_ReviewRecords from "./components/anneal-wizard-panels/ReviewRecords.vue";
import Anneal_SelectIdColumn from "./components/anneal-wizard-panels/SelectIdColumn.vue";
import Anneal_SelectPartitionColumn from "./components/anneal-wizard-panels/SelectPartitionColumn.vue";
import Anneal_DesignGroupStructure from "./components/anneal-wizard-panels/DesignGroupStructure.vue";
import Anneal_ConfigureGroups from "./components/anneal-wizard-panels/ConfigureGroups.vue";
import Anneal_ConfigureConstraints from "./components/anneal-wizard-panels/ConfigureConstraints.vue";
import Anneal_ViewResult from "./components/anneal-wizard-panels/ViewResult.vue";

Vue.use(VueRouter);

export default (store: Store<any>) => {
    const router = new VueRouter({
        routes: [
            {
                name: "welcome",
                path: "/",
                component: Welcome,
            },
            {
                name: "anneal-process",
                path: "/anneal",
                component: AnnealProcess,
                children: [
                    {
                        path: "",
                        redirect: "provide-records-file",
                    },

                    // NOTE: *At least one* of these components needs to be of
                    // type "any" in order to pass the TypeScript type checker
                    // 
                    // Appears to be some issue with interface/shape matching 
                    // after mixins were implemented
                    //
                    // Investigation into this filed as TEAMANNEAL-82
                    {
                        path: "provide-records-file",
                        component: Anneal_ProvideRecordsFile as any,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.provideRecordsFile,
                        },
                    },
                    {
                        path: "review-records",
                        component: Anneal_ReviewRecords,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.reviewRecords,
                        },
                    },
                    {
                        path: "select-id-column",
                        component: Anneal_SelectIdColumn,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.selectIdColumn,
                        },
                    },
                    {
                        path: "select-partition-column",
                        component: Anneal_SelectPartitionColumn,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.selectPartitionColumn,
                        },
                    },
                    {
                        path: "define-group-structure",
                        component: Anneal_DesignGroupStructure,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.designGroupStructure,
                        },
                    },
                    {
                        path: "configure-groups",
                        component: Anneal_ConfigureGroups,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.configureGroups,
                        },
                    },
                    {
                        path: "set-constraints",
                        component: Anneal_ConfigureConstraints,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.configureConstraints,
                        },
                    },
                    {
                        path: "view-result",
                        component: Anneal_ViewResult,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.viewResult,
                        },
                    },
                ]
            },
            {
                name: "results-editor",
                path: "/editor",
                component: ResultsEditor,
            },
        ],
    });

    router.beforeEach((to, _from, next) => {
        // If this is part of a wizard, check whether it is disabled
        if (to.meta && to.meta.wizardEntry) {
            const wizardEntry: WizardNavigationEntry.WizardNavigationEntry<IState> = to.meta.wizardEntry;

            // Get the disabled checking function
            const isDisabledFn = wizardEntry.disabled;

            // If the function does not exist we assume that it is always not
            // disabled
            const isDisabled =
                isDisabledFn === undefined ?
                    false :
                    isDisabledFn(store.state);

            // If route is disabled, return to root
            if (isDisabled) {
                return next({
                    path: "/",
                });
            }
        }

        return next();
    });

    return router;
}
