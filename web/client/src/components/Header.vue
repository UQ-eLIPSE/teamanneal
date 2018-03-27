<template>
    <div class="header"
         :class="headerClasses">
        <h1 v-if="!options.enableMenu">
            <a :class="logoClasses"
               href="#">The University of Queensland</a>
        </h1>
        <HeaderMenu v-else></HeaderMenu>

        <h2>
            {{options.headerText}}
        </h2>


    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import HeaderMenu from "./HeaderMenu.vue";
import { HeaderOptions } from "../data/Header";

@Component({
    components: {
        HeaderMenu
    }
})
export default class Header extends Vue {
    @Prop options = p<HeaderOptions>({ required: true });

    get headerClasses() {
        return {
            'header-minimal': this.options.minimal
        }
    }

    get logoClasses() {
        return {
            "uq-logo": !this.options.enableMenu,
            "uq-logo-minimal": this.options.minimal
        }
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.header {
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

.header-minimal {
    padding: 0.3rem 0rem;
}



.header h1,
.header h2 {
    font-weight: normal;
    color: inherit;
    margin: 0;
    padding: 0;
    border: 0;
}

.header h1 {
    padding: 0.4rem 1rem;
    border-right: 0.1rem solid rgba(255, 255, 255, 0.15);
    margin-right: 1.2rem;
}

.header h2 {
    font-size: 1.8em;
    font-weight: 300;
}

.uq-logo {
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

.uq-logo-minimal {
    background-size: 119px 33px;
    height: 33px;
    width: 121px;
}

.menu {
    cursor: pointer;
}
</style>
