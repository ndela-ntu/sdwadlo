import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface UploadFileParams {
  file: File;
  folder?: string;
}

export const uploadFileToS3 = async ({
  file,
  folder = "",
}: UploadFileParams): Promise<string> => {
  try {
    const fileBuffer = await file.arrayBuffer();
    const fileExtension = file.name.split(".").pop();
    const key = `${folder ? `${folder}/` : ""}${uuidv4()}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3.");
  }
};

export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  console.log(fileUrl);
  
  try {
    const url = new URL(fileUrl);
    const bucketName = url.hostname.split(".")[0];
    const objectKey = decodeURIComponent(url.pathname.substring(1));

    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error("Failed to delete file from S3.");
  }
};
