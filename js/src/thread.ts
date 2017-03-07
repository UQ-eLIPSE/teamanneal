declare const require: Function;
declare const importScripts: Function;

importScripts("../node_modules/requirejs/require.js");

require(
    {
        baseUrl: "./"
    },
    ["require", "AnnealThread"],
    function(_require: any, AnnealThread: any) {
        AnnealThread.setup();
    }
);
