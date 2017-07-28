import { ColumnData } from "./ColumnData";

export interface State {
    /** Record data */
    data: {
        /** Data source (file, etc.) */
        source: {
            /** Name of source (file name, etc.) */
            name: string,
        },

        /** Data organised by column */
        columns: ColumnData[],
    },

    annealConfig: {
        // TODO: 
    }

}
