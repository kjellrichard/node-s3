const archive = require('./archive');
const { uploadFile } = require('./s3');
const { rm } = require('fs/promises');
const os = require('os');
const { basename } = require('path')
module.exports.move = async function move({ target, verbose = false, directory, storageClass, partSizeMb }) {
    const start = Date.now();
    if (!target)
        target = `${os.tempdir || '.'}/${basename(directory)}.zip`;
    const archiveResult = await archive({ directory, target, verbose })
    const uploadResult = await uploadFile({ filename: archiveResult.filename, deleteAfter: true, verbose, storageClass, partSizeMb })

    await rm(directory, { recursive: true })
    verbose && console.log(`Removed directory ${directory}`)
    const { bytes } = archiveResult
    const elapsed = Date.now() - start;
    return {
        bytes,
        elapsed,
        archiveElapsed: archiveResult.elapsed,
        uploadElapsed: uploadResult.elapsed,
        name: uploadResult.name,
        storageClass
    }
}