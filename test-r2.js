const s3 = require("./config/s3Client");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

async function testR2Connection() {
    console.log("⚡ Initiating Cloudflare R2 Connection Test...");
    console.log(`Endpoint: ${process.env.AWS_S3_ENDPOINT}`);
    console.log(`Bucket: ${process.env.S3_BUCKET_NAME}`);
    console.log(`Region: ${process.env.AWS_REGION}`);

    const testFileName = `test-connection-${Date.now()}.txt`;
    const testContent = "Hello from Cloudflare R2! Connection is working perfectly.";

    try {
        console.log("\n1. Testing Upload (PutObjectCommand)...");
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: testFileName,
            Body: testContent,
            ContentType: "text/plain"
        }));
        console.log("✅ Upload Succeeded!");

        console.log("\n2. Testing Retrieve (GetObjectCommand)...");
        const response = await s3.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: testFileName
        }));
        
        const contentStream = await response.Body.transformToString();
        console.log("✅ Retrieve Succeeded!");
        console.log(`📥 Retrieved File Content: "${contentStream}"`);
        
        console.log("\n🎉 Cloudflare R2 connection test completed successfully!");
    } catch (error) {
        console.error("\n❌ Connection Test Failed!");
        console.error("Error details:", error.message);
        console.error("\nTips to debug:");
        console.error("- Check if your Access Key ID and Secret Access Key are entered correctly in `.env`.");
        console.error("- Ensure the bucket name in S3_BUCKET_NAME matches exactly with your Cloudflare dashboard.");
        console.error("- Make sure you gave the API token 'Edit' permissions during creation.");
    }
}

testR2Connection();
