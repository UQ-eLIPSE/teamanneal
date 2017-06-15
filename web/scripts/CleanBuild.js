const fs = require('fs-extra');

// Delete build folder
fs.removeSync(`${__dirname}/../build`);
