const { S3Client, ListObjectsCommand, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require("@aws-sdk/client-s3")
const DEFAULT_STORAGE_CLASS = 'STANDARD';
const { basename } = require('path')
const { readFile, unlink, stat } = require('fs/promises')
const { createReadStream } = require('fs')
const s3 = new S3Client({ region: process.env.AWS_REGION })
const Bucket = process.env.AWS_BUCKET
const DEFAULT_PARTSIZE_MB = 30;
async function uploadMultipartWithStream({ filename, storageClass = DEFAULT_STORAGE_CLASS, partSizeMb = DEFAULT_PARTSIZE_MB }) {
    const Key = basename(filename);
    const createParams = {
        Bucket, Key, StorageClass: storageClass
    }
    const createUploadResponse = await s3.send(
        new CreateMultipartUploadCommand(createParams)
    )
    const { UploadId } = createUploadResponse
    const uploadedParts = []
    const stream = createReadStream(filename, { highWaterMark: 1024 * 1024 * partSizeMb });
    let partNumber = 1;
    for await (const data of stream) {
        const uploadParams = {
            // add 1 to endOfPart due to slice end being non-inclusive
            Body: data,
            Bucket,
            Key,
            UploadId,
            PartNumber: partNumber
        }

        const uploadPartResponse = await s3.send(new UploadPartCommand(uploadParams))
        uploadedParts.push({ PartNumber: partNumber, ETag: uploadPartResponse.ETag })
        partNumber++;

    }

    const completeParams = {
        Bucket,
        Key,
        UploadId,
        MultipartUpload: {
            Parts: uploadedParts
        }
    }
    const completeData = await s3.send(new CompleteMultipartUploadCommand(completeParams))
    return completeData;
}

async function uploadFileWithPut({ filename, storageClass = DEFAULT_STORAGE_CLASS }) {
    const Body = await readFile(filename);
    const Key = basename(filename);
    const StorageClass = storageClass;

    const data = await s3.send(new PutObjectCommand({ Bucket, Key, Body, StorageClass }));
    return data;
}
module.exports.uploadMultipart = uploadMultipartWithStream;

module.exports.uploadFile = async function uploadFile({ filename, verbose = false, deleteAfter = false, storageClass = DEFAULT_STORAGE_CLASS, partSizeMb = DEFAULT_PARTSIZE_MB }) {
    const start = Date.now();
    const status = await stat(filename);
    
    const uploadType = (status.size / 1024 / 1024) > 100 ? 'multipart' : 'put';
    const response = await (uploadType === 'multipart' ? uploadMultipartWithStream({ filename, storageClass, partSizeMb }) : uploadFileWithPut({ filename, storageClass }))
    if (deleteAfter)
        await unlink(filename)
    const elapsed = Date.now() - start;
    verbose && console.log(`${filename} uploaded to s3 ${deleteAfter ? 'and then deleted from disk' : ''}. [${elapsed}ms]`)
    const name = basename(filename);
    return {
        _response: response,
        name,
        elapsed,
        storageClass,
        uploadType
    }
};


module.exports.listObjects = async function listObjects() {
    const data = await s3.send(new ListObjectsCommand({ Bucket }));
    return data.Contents || [];
}

module.exports.deleteObject = async function deleteObject({ name }) {
    const Key = name;
    const data = await s3.send(new DeleteObjectCommand({ Bucket, Key }));
    return data;
}