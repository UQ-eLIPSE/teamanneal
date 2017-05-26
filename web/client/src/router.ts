import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";

// Subcomponents
import Welcome from "./components/Welcome.vue";
import AnnealProcess from "./components/AnnealProcess.vue";

import Anneal_ProvideRecordsFile from "./components/anneal-wizard-panels/ProvideRecordsFile.vue";
import Anneal_ReviewRecords from "./components/anneal-wizard-panels/ReviewRecords.vue";
import Anneal_SelectIdColumn from "./components/anneal-wizard-panels/SelectIdColumn.vue";
import Anneal_SelectPartitionColumn from "./components/anneal-wizard-panels/SelectPartitionColumn.vue";
import Anneal_ConfigureOutputGroups from "./components/anneal-wizard-panels/ConfigureOutputGroups.vue";
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
                    },
                    {
                        path: "review-records",
                        component: Anneal_ReviewRecords,
                        meta: { annealDataRequired: true, },
                    },
                    {
                        path: "select-id-column",
                        component: Anneal_SelectIdColumn,
                        meta: { annealDataRequired: true, },
                    },
                    {
                        path: "select-partition-column",
                        component: Anneal_SelectPartitionColumn,
                        meta: { annealDataRequired: true, },
                    },
                    {
                        path: "configure-output-groups",
                        component: Anneal_ConfigureOutputGroups,
                        meta: { annealDataRequired: true, },
                    },
                    {
                        path: "configure-constraints",
                        component: Anneal_ConfigureConstraints,
                        meta: { annealDataRequired: true, },
                    }
                ]
            },
        ],
    });

    router.beforeEach((to, _from, next) => {
        if (to.meta.annealDataRequired) {
            console.log(`Route ${to.path} will check for anneal data`);

            console.log(store.state.constraintsConfig);

            // return next({
            //     path: "/",
            // });
        }

        return next();
    });

    return router;
}
