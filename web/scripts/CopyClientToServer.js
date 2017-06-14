const fs = require('fs-extra');

// Copy over the client folder to the server
fs.copySync(`${__dirname}/../client`, `${__dirname}/../server/build/client`);
