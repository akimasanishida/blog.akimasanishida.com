import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";

async function main() {
  console.log("=== Upload Test Image ===");
  console.log(`I will upload a test image "smile.png" to ${process.env.STORAGE_BUCKET_NAME}.`);
  try {
    const s3 = new S3Client({
      region: "auto", // Required by AWS SDK, not used by R2
      // Provide your R2 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
      endpoint: process.env.STORAGE_ENDPOINT_URL!,
      credentials: {
        // Provide your R2 Access Key ID and Secret Access Key
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
    });

    // Upload a file
    const fileBuffer = await readFile("./scripts/smile.png");
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.STORAGE_BUCKET_NAME!,
        Key: "images/smile.png",
        Body: fileBuffer,
        ContentType: "image/png",
      }),
    );
  } catch (error) {
    console.error("Failed to upload file: ", error);
  }
  console.log("Uploaded as images/smile.png");
}

main();
