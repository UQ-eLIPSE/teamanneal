<template>
    <div id="header">
        <h1>
            <a v-if="!enableMenu"
               :class="headerClasses"
               href="#">The University of Queensland</a>
        </h1>
        <h2>
            TeamAnneal
        </h2>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

@Component
export default class Header extends Vue {
    @Prop minimal = p<boolean>({ required: false, default: () => false });
    @Prop enableMenu = p<boolean>({ required: false, default: () => true });


    get headerClasses() {
        return {
            'uq-logo': !this.enableMenu,
            'header-minimal': this.minimal
        }
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
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

.header-minimal {
    padding: 
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
</style>
