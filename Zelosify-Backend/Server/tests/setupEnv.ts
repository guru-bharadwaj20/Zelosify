process.env.ENCRYPTION_ALGORITHM =
  process.env.ENCRYPTION_ALGORITHM || "aes-256-gcm";
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  "8939bdfd2c3d1882977a6679d0d3471f718dabba53980be288e82b6e76e93db9";
process.env.S3_AWS_REGION = process.env.S3_AWS_REGION || "us-east-1";
process.env.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "test-access-key";
process.env.S3_SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY || "test-secret-key";
process.env.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "test-bucket";
