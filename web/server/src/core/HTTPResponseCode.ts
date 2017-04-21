/*
 * HTTP Response Codes
 */

export namespace SUCCESS {
    export const OK = 200;
    export const CREATED = 201;
    export const ACCEPTED = 202;
    export const NO_CONTENT = 204;
    export const PARTIAL_CONTENT = 206;
}

export namespace REDIRECTION {
    export const MOVED_PERMANENTLY = 301;
    export const FOUND = 302;
    export const NOT_MODIFIED = 304;
}

export namespace CLIENT_ERROR {
    export const BAD_REQUEST = 400;
    export const UNAUTHORIZED = 401;
    export const FORBIDDEN = 403;
    export const NOT_FOUND = 404;
    export const METHOD_NOT_ALLOWED = 405;
    export const REQUEST_TIMEOUT = 408;
}

export namespace SERVER_ERROR {
    export const INTERNAL_SERVER_ERROR = 500;
    export const BAD_GATEWAY = 502;
    export const SERVICE_UNAVAILABLE = 503;
    export const GATEWAY_TIME_OUT = 504;
}
