const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

const clientConfig = {
    region: process.env.AWS_REGION || "auto",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
};

if (process.env.AWS_S3_ENDPOINT) {
    clientConfig.endpoint = process.env.AWS_S3_ENDPOINT;
}

const s3 = new S3Client(clientConfig);

module.exports = s3;