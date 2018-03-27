<template>
    <div class="menu">
        <button class="menu-icon"
                @click.prevent.stop="toggleMenu">
            {{iconText}}
        </button>
        <div class="menu-items"
             v-show="open">
            <router-link @click.native="closeMenu"
                         :to="item.route"
                         class="menu-item"
                         v-for="(item, i) in menuItems"
                         :key="i">
                <span>{{item.label}}</span>
            </router-link>
        </div>
    </div>
</template>

<!-- ####################################################################### -->

<script lang="ts">
import { Vue, Component, Prop, p } from "av-ts";

const MENU_ITEMS = [
    {
        route: '/anneal',
        label: 'Creator'
    },
    {
        route: '/editor',
        label: 'Editor'
    },
    {
        route: '/help',
        label: 'Help'
    }
]

@Component
export default class HeaderMenu extends Vue {
    @Prop enableMenu = p<boolean>({ required: false, default: () => true });
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
        if(this.open) {
            return "×";
        }

        return "☰";
    }

    toggleMenu() {
        this.open = !this.open;
    }

    openMenu() {
        this.open = true;
    }

    closeMenu() {
        console.log('closed');
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
    background-color: rgba(240, 240, 240, 1);
    position: absolute;
    width: 20rem;
    box-shadow: 0 0.4rem 0.24rem -0.24rem #777;
}

.menu-items .menu-item:not(:last-child) {
    border-bottom: 0.01em solid rgba(73, 7, 94, 0.8);
}

.menu-item {
    color: inherit;
    text-decoration: none;
    padding: 0.5rem;
}

.menu-item:hover,
.menu-item:active,
.menu-item:focus {
    background-color: rgba(190, 190, 190, 1);
    outline: 0.01em solid rgba(73, 7, 94, 0.8);
}

.menu-icon {
    padding: 0.4rem 1rem;
    border: none;
    border-right: 0.1rem solid rgba(255, 255, 255, 0.15);
    margin-right: 1.2rem;
    cursor: pointer;
    background: #ccc;
    min-width: 3.5rem;
    font-size: 1em;
    
}

.menu-icon:hover,
.menu-icon:focus,
.menu-icon:active {
    background: #ddd;
    box-shadow: rgba(55, 55, 55, 0.3) 0 0.2rem 0.5rem;
}
</style>
