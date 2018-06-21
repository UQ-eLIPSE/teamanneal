const fs = require('fs-extra');

// Copy over the index.html page to the build folder
fs.copySync(`${__dirname}/../client/index.html`, `${__dirname}/../client/build/client/index.html`);
