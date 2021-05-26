const {expect} = require('chai');
const {createArchive} = require('../index');
const {unlink, readdir} = require('fs/promises')

describe('Archive', ()=>{
    it('should archive some files', async ()=>{
        const files = (await readdir(__dirname)).map(file=>`${__dirname}/${file}`);        
        const archiveResult = await createArchive({files, target: 'test1.zip'});
        expect(archiveResult).to.include.keys('filename', 'bytes', 'elapsed', 'fileCount');
        expect(archiveResult.fileCount).to.equal(files.length);
        await unlink(archiveResult.filename);
    })
    it('should archive an entire directory', async ()=>{
        const archiveResult = await createArchive({directory: __dirname, target: 'test1.zip'});
        expect(archiveResult).to.not.equal(null);
        expect(archiveResult).to.include.keys('filename', 'bytes', 'elapsed');
        await unlink(archiveResult.filename);
    })
})
