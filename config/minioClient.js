const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    endpoint: "http://localhost:9000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "minioadmin",
        secretAccessKey: "minioadmin",
    },
    forcePathStyle: true,
    secretAccessKey: "minioadmin",
});

module.exports = s3;