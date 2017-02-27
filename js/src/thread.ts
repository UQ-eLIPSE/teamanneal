importScripts("../node_modules/requirejs/require.js");

declare const require: any;

require(
    {
        baseUrl: "./"
    },
    ["require", "AnnealThread"],
    function(_require: any, AnnealThread: any) {
        AnnealThread.setup();
    }
);