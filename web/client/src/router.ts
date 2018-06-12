import Vue from "vue";
import VueRouter from "vue-router";

// Data
import { WizardNavigationEntry as WNE } from "./data/WizardNavigationEntry";
import * as AnnealProcessWizardEntries from "./data/AnnealProcessWizardEntries";

// Subcomponents
import Welcome from "./components/Welcome.vue";
import AnnealProcess from "./components/AnnealProcess.vue";
import ResultsEditor from "./components/ResultsEditor.vue";

import Anneal_ProvideRecordsFile from "./components/anneal-wizard-panels/ProvideRecordsFile.vue";
import Anneal_ReviewRecords from "./components/anneal-wizard-panels/ReviewRecords.vue";
import Anneal_SelectIdColumn from "./components/anneal-wizard-panels/SelectIdColumn.vue";
import Anneal_SelectPartitionColumn from "./components/anneal-wizard-panels/SelectPartitionColumn.vue";
import Anneal_poolRecords from "./components/anneal-wizard-panels/PoolRecords.vue";
import Anneal_DesignGroupStructure from "./components/anneal-wizard-panels/DesignGroupStructure.vue";
import Anneal_ConfigureGroups from "./components/anneal-wizard-panels/ConfigureGroups.vue";
import Anneal_ConfigureConstraints from "./components/anneal-wizard-panels/ConfigureConstraints.vue";
import Anneal_RunAnneal from "./components/anneal-wizard-panels/RunAnneal.vue";

Vue.use(VueRouter);

export default () => {
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
                    {
                        path: "provide-records-file",
                        component: Anneal_ProvideRecordsFile,
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
                        path: "pool-records",
                        component: Anneal_poolRecords,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.poolRecords,
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
                        path: "run-anneal",
                        component: Anneal_RunAnneal,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.runAnneal,
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
            const wizardEntry: WNE = to.meta.wizardEntry;

            // Get the disabled checking function
            const isDisabledFn = wizardEntry.disabled;

            // If the function does not exist we assume that it is always not
            // disabled
            const isDisabled =
                isDisabledFn === undefined ?
                    false :
                    isDisabledFn();

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
