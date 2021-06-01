const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

async function createArchive({ files, target, verbose = false, directory } = {}) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const output = fs.createWriteStream(target);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', function () {
            const bytes = archive.pointer();
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const fileCount = files?.length;
            let size;
            if (bytes / 1024 / 1024 >= 1)
                size = `${Math.round(bytes / 1024 / 1024, 1)}MB`;
            else
                size = `${Math.round(bytes / 1024, 1)}KB`
            verbose && console.log(`${size} written from ${fileCount ? `${fileCount}  files` : directory}  to ${target}. [${elapsed}s]`);
            resolve({
                filename: target,
                bytes,
                elapsed,
                fileCount
            })
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        output.on('end', function () {

        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
                // logger && logger.log('verbose','WARNING:', err.message)
            } else {
                reject(err)
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function (err) {            
            reject(err);
        });

        // pipe archive data to the file
        archive.pipe(output);


        // append a file from stream
        if (files) {
            for (let file of files) {
                const filePath = file.file ? file.file : file
                const name = file.name ? file.name : path.basename(file)
                archive.file(filePath, { name })
            }
        }

        if (directory) {
            archive.directory(directory, false);
        }

        archive.finalize();
    })
}
module.exports = createArchive