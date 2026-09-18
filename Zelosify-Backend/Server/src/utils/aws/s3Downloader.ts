import { Readable } from "stream";
import { createStorageService } from "../../services/storage/storageFactory.js";

export const downloadObjectAsBuffer = async (key: string): Promise<Buffer> => {
  const storageService = createStorageService();
  const stream: Readable = await storageService.getObjectStream(key);
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};
