const fs = require('fs-extra');

// Delete build folders
fs.removeSync(`${__dirname}/../client/build`);
fs.removeSync(`${__dirname}/../server/build`);
