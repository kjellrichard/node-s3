require('./bootstrap');
const {expect} = require('chai')
const {basename} = require('path');
const {uploadFile,deleteObject,listObjects} = require('../index');
const { uploadMultipart } = require('../src/lib/s3');

describe('S3', async ()=>{
    it('should upload and delete a file to an s3 bucket', async ()=>{        
        const filename = __filename;
        const name = basename(filename);
        const uploadResult = await uploadFile({filename})
        expect(uploadResult).to.not.equal(null);
        expect(uploadResult).to.include.keys('name', 'elapsed','uploadType','storageClass');
        expect(uploadResult.uploadType).to.equal('put');
        const objects = await listObjects();
        expect(objects.find(o=>o.Key === name)).to.not.equal(null);
        const deleteResult = await deleteObject({name});
        expect(deleteResult).to.not.equal(null);
    })

    it('should upload a file with a specified storage class',async ()=>{
        const filename = __filename;
        const name = basename(filename);
        const storageClass = 'STANDARD_IA'
        await uploadFile({filename, storageClass})        
        const objects = await listObjects();
        const found = objects.find(o=>o.Key === name);
        expect(found.StorageClass).to.equal(storageClass);
        await deleteObject({name});        
    })

    it('should upload a file using multipart upload',async ()=>{
        const filename = 'c:\\temp\\Docker Desktop Installer.exe';
        const name = basename(filename);
        const uploadResult = await uploadMultipart({filename, partSizeMb: 100})        
        const objects = await listObjects();
        const found = objects.find(o=>o.Key === name);
        expect(found).to.not.equal(null);
        await deleteObject({name});        
    }).timeout(Infinity)

    it('should list objects in an s3 bucket', async ()=>{
        const listResult = await listObjects();
        expect(listResult).to.not.equal(null);
    })

})