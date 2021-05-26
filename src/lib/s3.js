const { S3Client, ListObjectsCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")

const path = require('path')
const {readFile,unlink} = require('fs/promises')

const s3 = new S3Client({ region: process.env.AWS_REGION })
const Bucket = process.env.AWS_BUCKET

module.exports.uploadFile = async function uploadFile({filename, verbose=false, deleteAfter=false, storageClass},) { 
    const start = Date.now();     
    const Body = await readFile(filename);
    const Key = path.basename(filename);
    const StorageClass = storageClass;
    const data = await s3.send(new PutObjectCommand({ Bucket, Key, Body, StorageClass }));    
    if ( deleteAfter) 
        await unlink(filename)  
    const elapsed = Date.now()-start;
    verbose && console.log(`${filename} uploaded to s3 ${deleteAfter ? 'and then deleted from disk' : ''}. [${elapsed}ms]`)
    return {
        _response: data,
        name: Key,
        elapsed
    }
};

module.exports.listObjects = async function listObjects() {
    const data = await s3.send(new ListObjectsCommand({Bucket}));
    return data.Contents || [];
}

module.exports.deleteObject = async function deleteObject({name}) {
    const Key = name;
    const data = await s3.send(new DeleteObjectCommand({Bucket, Key}));
    return data;
}