<template>
    <div id="teamanneal">
        <Notifications></Notifications>
        <Header :minimal="headerOptions.minimal"
                :headerText="headerOptions.headerText"
                :enableMenu="headerOptions.enableMenu"></Header>
        <div id="content">
            <router-view />
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";
import Header from "./Header.vue";
import { HEADER_CONFIG } from "../data/Header";
import Notifications from "./Notifications.vue";
@Component({
    components: {
        Header,
        Notifications
    }
})
export default class TeamAnneal extends Vue {

    /** 
     * Matches the current route and returns appropriate header options
     */
    get headerOptions() {
        // Check if a match was found for the current route
        if (this.$route.matched[0]) {
            // $route.matched contains route records for all nested path segments of the current route.
            // Route records are stored in parent to child order.
            // Match the first record i.e. the top-level parent route
            switch (this.$route.matched[0].path) {
                case HEADER_CONFIG.anneal.path: return HEADER_CONFIG.anneal.headerOptions;
                case HEADER_CONFIG.editor.path: return HEADER_CONFIG.editor.headerOptions;
                case HEADER_CONFIG.home.path: return HEADER_CONFIG.home.headerOptions;
                default: return HEADER_CONFIG.default.headerOptions;
            }
        }
        return HEADER_CONFIG.default.headerOptions;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
#teamanneal {
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
}

#header {
    background-color: #49075E;
    padding: 1rem 1.6rem;
    font-size: 0.8rem;
    color: #fff;
    width: 100%;
    display: flex;
    flex-direction: row;

    flex-shrink: 0;
    flex-grow: 0;

    align-items: center;
}

#header h1,
#header h2 {
    font-weight: normal;
    color: inherit;
    margin: 0;
    padding: 0;
    border: 0;
}

#header h1 {
    padding: 0.4rem 1rem;
    border-right: 0.1rem solid rgba(255, 255, 255, 0.15);
    margin-right: 1.2rem;
}

#header h2 {
    font-size: 1.8em;
    font-weight: 300;
}

#uq-logo {
    background: url(https://static.uq.net.au/v3/logos/corporate/uq-logo-white.png) no-repeat 0 0;
    background-image: url(https://static.uq.net.au/v3/logos/corporate/uq-logo-white.svg);
    background-size: 178px 50px;
    height: 50px;
    width: 182px;
    text-indent: -9999px;
    display: block;
    margin: 0;
    padding: 0;
}





#content {
    flex-shrink: 0;
    flex-grow: 1;

    position: relative;

    background: #f5f5f5;
    background-image: linear-gradient(to top, rgba(73, 7, 94, 0.5), rgba(73, 7, 94, 0.1)), url(../static/bonding-1985863_1920.jpg);
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
}
</style>
