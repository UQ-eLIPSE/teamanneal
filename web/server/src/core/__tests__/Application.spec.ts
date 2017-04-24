import * as Application from "../Application";

import * as express from "express";

describe("`init`", () => {
    test("returns something", () => {
        const expressInstance = Application.init();

        expect(expressInstance).toBeDefined();
    });
});

describe("`enableBodyParser`", () => {
    let app: express.Express;

    beforeEach(() => {
        app = Application.init();
    });

    test("enables body parsers (url-encoded, json)", () => {
        Application.enableBodyParser(app);

        const routers = app._router.stack as any[];

        let hasUrlencodedParser = false;
        let hasJsonParser = false;

        // Find the parser names in the list of routers/middleware
        routers.forEach((router) => {
            switch (router.name) {
                case "urlencodedParser": return (hasUrlencodedParser = true);
                case "jsonParser": return (hasJsonParser = true);
            }
        });

        expect(hasUrlencodedParser).toBe(true);
        expect(hasJsonParser).toBe(true);
    });

    test("returns the same application instance back", () => {
        const result = Application.enableBodyParser(app);
        expect(result).toBe(app);
    });
});

describe("`listenOn`", () => {
    let app: express.Express;

    beforeEach(() => {
        app = Application.init();
    });

    test("sets server up to listen at specified port", () => {
        const port: number = 23875;
        const server = Application.listenOn(app)(port);

        expect(server.address().port).toBe(port);
    });
});
