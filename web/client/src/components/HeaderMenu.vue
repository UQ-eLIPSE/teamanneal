<template>
    <div class="menu" v-if="enableMenu">
        <button class="menu-button"
                @click.prevent.stop="toggleMenu">
            <span>{{iconText}}</span>
            <span class="menu-heading">Menu</span>
        </button>
        <div class="menu-items"
             v-show="open">
            <router-link @click.native="closeMenu"
                         :to="item.ROUTE"
                         class="menu-item"
                         v-for="(item, i) in menuItems"
                         :key="i">
                <span>{{item.LABEL}}</span>
            </router-link>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";
import { MENU_ITEMS } from "../data/Header";

@Component
export default class HeaderMenu extends Vue {
    @Prop enableMenu = p<boolean>({ required: false, default: true });
    private menuOpen: boolean = false;

    get open() {
        return this.menuOpen;
    }

    set open(option: boolean) {
        this.menuOpen = option;
    }

    get menuItems() {
        return MENU_ITEMS;
    }

    get iconText() {
        return this.open ? "×" : "☰";
    }

    toggleMenu() {
        this.open = !this.open;
    }

    closeMenu() {
        this.open = false;
    }
}
</script>

<!-- ####################################################################### -->

<style scoped>
.menu {
    position: relative;
    font-size: 1.8em;
    z-index: 10;
    color: #49075e;
}

.menu-items {
    display: flex;
    flex-direction: column;
    border: 0.1em solid rgba(73, 7, 94, 0.6);
    background-color: rgba(250, 250, 250, 1);
    position: absolute;
    width: 20rem;
    padding: 0.4rem;
    box-shadow: 0 0.4rem 0.24rem -0.24rem #777;
}

.menu-items .menu-item:not(:last-child) {
    border-bottom: 0.01em solid rgba(73, 7, 94, 0.8);
}

.menu-item {
    color: inherit;
    text-decoration: none;
    padding: 1rem 0.5rem;
}

.menu-item:hover,
.menu-item:active,
.menu-item:focus {
    background-color: rgba(73, 7, 94, 0.1);
    outline: 0.01em solid rgba(73, 7, 94, 0.8);
}

.menu-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 1rem;
    border: none;
    background: #49075e;
    border-right: 0.1rem solid rgba(255, 255, 255, 0.15);
    margin-right: 1.2rem;
    cursor: pointer;
    color: white;
    min-width: 7rem;
    font-size: 1em;
}

.menu-button:hover,
.menu-button:focus,
.menu-button:active {
    background: #7f518e;
    box-shadow: rgba(55, 55, 55, 0.3) 0 0.2rem 0.5rem;
}

.menu-heading {
    font-size: 0.8em;
    font-weight: 400;
}
</style>
