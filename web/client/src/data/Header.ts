export interface HeaderOptions {
    headerText: string;
    minimal: boolean;
    enableMenu: boolean;
}

export const HEADER_CONFIG: { [key: string]: { path?: string; headerOptions: HeaderOptions } } = {
    anneal: {
        path: "/anneal",
        headerOptions: {
            headerText: 'TeamAnneal Creator',
            minimal: true,
            enableMenu: true
        }
    },
    editor: {
        path: "/editor",
        headerOptions: {
            headerText: 'TeamAnneal Editor',
            minimal: true,
            enableMenu: true
        }
    },
    home: {
        path: "",
        headerOptions: {
            headerText: 'TeamAnneal',
            minimal: false,
            enableMenu: false
        }
    },
    default: {
        headerOptions: {
            headerText: 'TeamAnneal',
            minimal: true,
            enableMenu: true
        }
    }
}

export const MENU_ITEMS: { route: string; label: string }[] = [
    {
        route: '/',
        label: 'Home'
    },
    {
        route: '/anneal',
        label: 'TeamAnneal Creator'
    },
    {
        route: '/editor',
        label: 'TeamAnneal Editor'
    },
    // {
    //     route: '/help',
    //     label: 'Help'
    // }
];
