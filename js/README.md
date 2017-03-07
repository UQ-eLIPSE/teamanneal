# teamanneal.js

## Getting up and running
Requires `npm` as package manager.

1. `npm install`
2. `npm run build`
3. Go to `index.html`
    * Files may be statically hosted on a web server (incl. `node_modules` folder, because some dependencies haven't been folded into the build step yet)

## Code
Source is written in TypeScript compiled to JavaScript/ES5.

Some ES6 features are used:
* Promises
* Map
* Set

This should mean support for:
* Chrome
* Firefox
* Edge
* Safari 8+
* IE 11

Broader support is not expected because of performance reasons, though the ES6 features are shimmable.
