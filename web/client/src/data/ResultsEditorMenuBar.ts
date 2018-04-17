export interface MenuItem {
    /** Unique name for each item */
    name: string,

    /** Label attached to menu item entry */
    label: string,

    /** 
     * Determines where to locate the item.
     * 
     * "start" = Start of the menu bar (top)
     * "center" = Middle of the menu bar
     * "end" = End of the menu bar (bottom) 
     */
    region?: "start" | "center" | "end",

    /** Component to render in side panel */
    // TODO: Figure out what a component type is
    component?: any,
}
