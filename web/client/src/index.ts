import "es6-promise/auto";  // Required for IE11

import Vue from "vue";

// Root app
import "./static/stylesheet.css";
import TeamAnneal from "./components/TeamAnneal.vue";

// Router and store
import { store } from "./store";
import router from "./router";

// Bootstrap TeamAnneal component into #teamanneal
const teamanneal = new Vue({
    el: "#teamanneal",
    render: h => h(TeamAnneal),

    store,
    router: router(),
});

// Expose information when environment is dev
if (process.env.NODE_ENV === "development") {
    (window as any).__TA = {
        instance: teamanneal,
        store,
    };
}
