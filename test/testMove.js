require('./bootstrap');
const { expect } = require('chai');
const {mkdir, copyFile, readdir } = require('fs/promises')
const {move, deleteObject} = require('../index')

describe('Move', ()=>{
    it('should zip a folder and move to an s3 bucket', async ()=>{
        const files = await readdir(__dirname);
        const destination = `${__dirname}/.tmp`
        await mkdir(destination)
        for ( const file of files) 
            await copyFile(`${__dirname}/${file}`,`${destination}/${file}`)
        const moveResult = await move({directory:destination});        
        expect(moveResult).to.include.keys('bytes','elapsed','archiveElapsed','uploadElapsed', 'name');
        await deleteObject({name: moveResult.name});
    })
})