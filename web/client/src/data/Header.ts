export interface HeaderOptions {
    headerText: string;
    minimal: boolean;
    enableMenu: boolean;
}

export const HEADER_CONFIG = {
    ANNEAL: {
        PATH: "/anneal",
        HEADER_OPTIONS: {
            headerText: 'TeamAnneal Creator',
            minimal: true,
            enableMenu: true
        }
    },
    EDITOR: {
        PATH: "/editor",
        HEADER_OPTIONS: {
            headerText: 'TeamAnneal Editor',
            minimal: true,
            enableMenu: true
        }
    },
    HOME: {
        PATH: "",
        HEADER_OPTIONS: {
            headerText: 'TeamAnneal',
            minimal: false,
            enableMenu: false
        }
    },
    DEFAULT: {
        HEADER_OPTIONS: {
            headerText: 'TeamAnneal',
            minimal: true,
            enableMenu: true
        }
    }
}

export const MENU_ITEMS = [
    {
        ROUTE: '/',
        LABEL: 'Home'
    },
    {
        ROUTE: '/anneal',
        LABEL: 'Team Creator'
    },
    {
        ROUTE: '/editor',
        LABEL: 'Team Editor'
    },
    {
        ROUTE: '/help',
        LABEL: 'Help'
    }
];