import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAudioToR2(
  audioBuffer: Buffer,
  filename: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: audioBuffer,
    ContentType: "audio/mpeg",
  });

  await s3Client.send(command);

  // Возвращаем прямую ссылку на файл для плеера
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}

export async function uploadImageToR2(
  buffer: Buffer,
  filename: string,
  mimeType: string,
) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: mimeType, // Важно! передаем imageFile.type (например, image/png)
  });

  await s3Client.send(command);

  // Возвращаем URL или просто filename (зависит от твоей логики хранения)
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}
