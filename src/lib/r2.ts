import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile } from "fs/promises";
import path from "path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export function isR2Configured(): boolean {
  return !!(
    R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    R2_BUCKET_NAME &&
    R2_PUBLIC_URL
  );
}

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2(filePath: string): Promise<string> {
  const key = `videos/${Date.now()}-${path.basename(filePath)}`;

  // Generate presigned URL (no network call, just local signing)
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
    ContentType: "video/mp4",
  });
  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  // Upload via fetch (uses Node's native TLS, avoids AWS SDK SSL issues)
  const fileBuffer = await readFile(filePath);
  const res = await fetch(presignedUrl, {
    method: "PUT",
    body: fileBuffer,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(fileBuffer.length),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed: ${res.status} ${text}`);
  }

  return `${R2_PUBLIC_URL}/${key}`;
}
