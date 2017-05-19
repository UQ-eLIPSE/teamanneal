<template>
    <div id="teamanneal">
        <div id="header">
            <h1>
                <a id="uq-logo" href="#">The University of Queensland</a>
            </h1>
            <h2>
                TeamAnneal
            </h2>
        </div>
        <div id="content" :class="{ 'bg-blur': contentBgBlur }">
            <router-view />
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component } from "av-ts";

@Component
export default class TeamAnneal extends Vue {
    contentBgBlur: boolean = false;


}
</script>

<!-- ####################################################################### -->

<!-- General styles to applied throughout the application -->
<!-- TODO: This should be moved off into separate stylesheet -->
<style>
html,
body {
    margin: 0;
    padding: 0;
    border: 0;
    height: 100%;

    box-sizing: border-box;

    font-family: "Roboto", "Helvetica", Helvetica, Arial, sans-serif;
    font-weight: 300;
    font-style: normal;
    font-size: 16px;

    cursor: default;

    line-height: 1.3;
}

*,
*::before,
*::after {
    box-sizing: inherit;
    line-height: inherit;
}



b {
    font-weight: 500;
}

input,
select,
option {
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
}

.button {
    background: #49075e;

    display: inline-block;

    padding: 1rem;
    border: 1px solid rgba(55, 5, 70, 0.3);
    border-radius: 0.2rem;

    font-family: inherit;
    font-size: 0.9em;
    font-weight: 400;
    text-transform: uppercase;
    color: #fff;

    cursor: pointer;

    box-shadow: transparent 0 0.2rem 0.5rem;
    transition: all 100ms linear;
}

.button:hover,
.button:focus,
.button:active {
    background: #370546;
    box-shadow: rgba(55, 5, 70, 0.3) 0 0.2rem 0.5rem;
}

.button.secondary {
    background: #f2f2f2;
    color: #49075e;
}

.button.secondary:hover,
.button.secondary:focus,
.button.secondary:active {
    background: #fafafa;
    box-shadow: rgba(55, 55, 55, 0.3) 0 0.2rem 0.5rem;
}

.button.gold {
    background: #bda14e;
    color: #fff;
    border-color: #a58d45;
}

.button.gold:hover,
.button.gold:focus,
.button.gold:active {
    background: #a58d45;
    box-shadow: rgba(90, 70, 40, 0.3) 0 0.2rem 0.5rem;
}

.button[disabled] {
    border-color: #888 !important;
    background: #aaa !important;
    color: #888 !important;
    cursor: not-allowed !important;
}

.button[disabled]:hover,
.button[disabled]:focus,
.button[disabled]:active {
    background: #b2b2b2;
    box-shadow: rgba(55, 55, 55, 0.3) 0 0.2rem 0.5rem;
}

a.more {
    color: #49075e;
    border-bottom: 1px dotted #49075e;
    text-decoration: none;
    display: inline-block;
}

a.more:hover,
a.more:focus,
a.more:active {
    border-bottom-style: solid;
}
</style>

<!-- Component specific styles -->
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
    /*height: 7rem;*/
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

    /** Disabling university logo **/
    background: rgba(255, 255, 255, 0.1);
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

#content::before {
    content: "";

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    background: rgba(0, 0, 0, 0.7);

    opacity: 0.7;

    transition: all 250ms ease-out;

    pointer-events: none;
}

#content.bg-blur::before {
    opacity: 1;
}
</style>
