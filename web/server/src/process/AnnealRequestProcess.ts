import * as AnnealRequestHandler from "../queue/AnnealRequest";
import * as AnnealResultHandler from "../queue/AnnealResult";

export function init() {
    console.log(`Anneal request handler - Initialising anneal request worker handler`);
    AnnealRequestHandler.init();

    console.log(`Anneal request handler - Initialising anneal internal result and collation handler`);
    AnnealResultHandler.init();

    console.log(`Anneal request handler - Initialisation complete`);
}
