import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";

// Data
import * as WizardNavigationEntry from "./data/WizardNavigationEntry";
import * as AnnealProcessWizardEntries from "./data/AnnealProcessWizardEntries";

// Subcomponents
import Welcome from "./components/Welcome.vue";
import AnnealProcess from "./components/AnnealProcess.vue";

import Anneal_ProvideRecordsFile from "./components/anneal-wizard-panels/ProvideRecordsFile.vue";
import Anneal_ReviewRecords from "./components/anneal-wizard-panels/ReviewRecords.vue";
import Anneal_SelectIdColumn from "./components/anneal-wizard-panels/SelectIdColumn.vue";
import Anneal_SelectPartitionColumn from "./components/anneal-wizard-panels/SelectPartitionColumn.vue";
import Anneal_DesignGroupStructure from "./components/anneal-wizard-panels/DesignGroupStructure.vue";
import Anneal_ConfigureGroups from "./components/anneal-wizard-panels/ConfigureGroups.vue";
import Anneal_ConfigureConstraints from "./components/anneal-wizard-panels/ConfigureConstraints.vue";


Vue.use(VueRouter);

export default (store: Vuex.Store<any>) => {
    const router = new VueRouter({
        routes: [
            {
                path: "/",
                component: Welcome,
            },
            {
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
                        path: "design-group-structure",
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
                        path: "configure-constraints",
                        component: Anneal_ConfigureConstraints,
                        meta: {
                            wizardEntry: AnnealProcessWizardEntries.configureConstraints,
                        },
                    }
                ]
            },
        ],
    });

    router.beforeEach((to, _from, next) => {
        // If this is part of a wizard, check whether it is disabled
        if (to.meta && to.meta.wizardEntry) {
            const wizardEntry: WizardNavigationEntry.WizardNavigationEntry = to.meta.wizardEntry;

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

    router.afterEach((to, _from) => {
        // Update current router path in store
        store.commit("updateRouterFullPath", to.fullPath);
    });

    return router;
}
