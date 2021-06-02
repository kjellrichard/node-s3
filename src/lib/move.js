const archive = require('./archive');
const { uploadFile } = require('./s3');
const { rm, readdir } = require('fs/promises');
const os = require('os');
const { basename } = require('path')

module.exports.move = async function move({ target, directory, storageClass, partSizeMb, removeIfEmpty = false, trace }) {
    const start = Date.now();
    if (!target)
        target = `${os.tempdir || '.'}/${basename(directory)}.zip`;
    let fileCount = undefined;
    if (removeIfEmpty) {
        fileCount = (await readdir(directory)).length;
        const fileCountResult = { directory, fileCount };
        trace && trace({ type: 'FileCount', payload: fileCountResult });
        if (fileCount < 1) {
            await rm(directory, { recursive: true })
            trace && trace({ type: 'RemovedDirectory', payload: fileCountResult })
            return fileCountResult;
        }

    }
    const archiveResult = await archive({ directory, target, verbose: false })
    trace && trace({ type: 'ArchiveCreated', payload: { ...archiveResult, fileCount: fileCount || archiveResult.fileCount } })
    const uploadResult = await uploadFile({ filename: archiveResult.filename, deleteAfter: true, storageClass, partSizeMb, verbose: false })
    storageClass = uploadResult.storageClass;
    trace && trace({ type: 'Upload', payload: { ...uploadResult } })
    await rm(directory, { recursive: true })
    trace && trace({ type: 'RemovedDirectory', payload: { directory, fileCount } })
    const { bytes } = archiveResult
    const elapsed = Date.now() - start;
    const result = {
        bytes,
        elapsed,
        fileCount,
        archiveElapsed: archiveResult.elapsed,
        uploadElapsed: uploadResult.elapsed,
        name: uploadResult.name,
        storageClass,
        fileCount
    }
    trace && trace({ type: 'End', payload: result })
    return result;
}