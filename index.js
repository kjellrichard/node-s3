const s3 = require('./src/lib/s3');
const createArchive = require('./src/lib/archive');
const move = require('./src/lib/move')
module.exports = {
    ...s3,
    createArchive,
    ...move
}