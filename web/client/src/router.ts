import Vue from "vue";
import VueRouter from "vue-router";

// Data
import { WizardNavigationEntry as WNE } from "./data/WizardNavigationEntry";
import * as AnnealProcessWizardEntries from "./data/AnnealProcessWizardEntries";

// Subcomponents
import Welcome from "./components/Welcome.vue";
import AnnealProcess from "./components/AnnealProcess.vue";
import ResultsEditor from "./components/ResultsEditor.vue";

import Anneal_ImportData from "./components/anneal-wizard-panels/ImportData.vue";
import Anneal_ReviewRecords from "./components/anneal-wizard-panels/ReviewRecords.vue";
import Anneal_SelectIdColumn from "./components/anneal-wizard-panels/SelectIdColumn.vue";
import Anneal_PoolRecords from "./components/anneal-wizard-panels/PoolRecords.vue";
import Anneal_DesignGroupStructure from "./components/anneal-wizard-panels/DesignGroupStructure.vue";
import Anneal_ConfigureGroups from "./components/anneal-wizard-panels/ConfigureGroups.vue";
import Anneal_ConfigureConstraints from "./components/anneal-wizard-panels/ConfigureConstraints.vue";
import Anneal_RunAnneal from "./components/anneal-wizard-panels/RunAnneal.vue";
import Anneal_ExportConfiguration from "./components/anneal-wizard-panels/ExportConfiguration.vue";

Vue.use(VueRouter);

export default () => {
    const router = new VueRouter({
        routes: [
            {
                path: "/",
                name: "welcome",
                component: Welcome,
            },
            {
                path: "/anneal",
                component: AnnealProcess,
                children: [
                    {
                        path: "",
                        name: "anneal",
                        redirect: "import-data",
                    },
                    {
                        path: "import-data",
                        name: "anneal-import-data",
                        component: Anneal_ImportData,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.importData,
                        },
                    },
                    {
                        path: "review-records",
                        name: "anneal-review-records",
                        component: Anneal_ReviewRecords,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.reviewRecords,
                        },
                    },
                    {
                        path: "select-id-column",
                        name: "anneal-select-id-column",
                        component: Anneal_SelectIdColumn,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.selectIdColumn,
                        },
                    },
                    {
                        path: "pool-records",
                        name: "anneal-pool-records",
                        component: Anneal_PoolRecords,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.poolRecords,
                        },
                    },
                    {
                        path: "define-group-structure",
                        name: "anneal-define-group-structure",
                        component: Anneal_DesignGroupStructure,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.designGroupStructure,
                        },
                    },
                    {
                        path: "configure-groups",
                        name: "anneal-configure-groups",
                        component: Anneal_ConfigureGroups,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.configureGroups,
                        },
                    },
                    {
                        path: "set-constraints",
                        name: "anneal-set-constraints",
                        component: Anneal_ConfigureConstraints,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.configureConstraints,
                        },
                    },
                    {
                        path: "run-anneal",
                        name: "anneal-run-anneal",
                        component: Anneal_RunAnneal,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.runAnneal,
                        },
                    },
                    {
                        path: "export-data",
                        name: "anneal-export-data",
                        component: Anneal_ExportConfiguration,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.exportData,
                        },
                    },
                ]
            },
            {
                path: "/editor",
                name: "results-editor",
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
