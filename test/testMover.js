require('./bootstrap');
const { expect } = require('chai');
const { mkdir, copyFile, readdir } = require('fs/promises')
const { Mover, deleteObject } = require('../index')

describe('Mover', () => {
    it('should zip a folder and move to an s3 bucket and emit events along the way', async () => {
        const files = await readdir(__dirname);
        const destination = `${__dirname}/.tmp`
        await mkdir(destination)
        for (const file of files)
            await copyFile(`${__dirname}/${file}`, `${destination}/${file}`)
        const mover = new Mover();
        let progress = {};
        mover.on('progress', ({ type, payload }) => {
            progress[type]=payload;
        });
        const moveResult = await mover.move({ directory: destination, removeIfEmpty: true })
        expect(moveResult).to.include.keys('bytes', 'elapsed', 'archiveElapsed', 'uploadElapsed', 'name');
        expect(progress.FileCount).to.include.keys('directory', 'fileCount');
        expect(progress.ArchiveCreated).to.include.keys('filename', 'bytes', 'elapsed', 'fileCount');
        expect(progress.Upload).to.include.keys('name', 'elapsed', 'storageClass', 'uploadType');
        expect(progress.RemovedDirectory).to.include.keys('directory', 'fileCount');
        expect(progress.End).to.include.keys('bytes', 'elapsed', 'fileCount', 'archiveElapsed', 'uploadElapsed', 'name', 'storageClass');
        await deleteObject({ name: moveResult.name });
    }).timeout(Infinity)
})