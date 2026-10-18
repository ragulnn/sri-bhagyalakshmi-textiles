import fs from 'fs';
import path from 'path';
import type { Readable } from 'stream';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Where product photos are kept.
 *  - If AZURE_STORAGE_ACCOUNT is set  -> Azure Blob Storage (survives restarts and redeploys).
 *  - Otherwise                        -> a local folder (handy for development).
 *
 * In Azure, sign-in uses the Container App's managed identity: no keys or passwords.
 */

// Only names we generate ourselves are ever stored or served.
export const IMAGE_NAME = /^[a-f0-9]{24}\.(jpg|png|gif|webp)$/;

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp'
};

export const mimeFor = (name: string) => MIME[name.split('.').pop() || ''] || 'application/octet-stream';

export interface StoredImage {
  stream: Readable;
  contentType: string;
  size?: number;
  etag?: string;
}

export interface ImageStore {
  kind: 'azure-blob' | 'local';
  save(name: string, data: Buffer): Promise<void>;
  open(name: string): Promise<StoredImage | null>;
}

export function createImageStore(uploadDir: string): ImageStore {
  const account = process.env.AZURE_STORAGE_ACCOUNT;

  if (!account) {
    fs.mkdirSync(uploadDir, { recursive: true });
    return {
      kind: 'local',
      async save(name, data) {
        if (!IMAGE_NAME.test(name)) throw new Error('Invalid image name');
        await fs.promises.writeFile(path.join(uploadDir, name), data);
      },
      async open(name) {
        if (!IMAGE_NAME.test(name)) return null;
        const file = path.join(uploadDir, name);
        try {
          const st = await fs.promises.stat(file);
          return { stream: fs.createReadStream(file), contentType: mimeFor(name), size: st.size };
        } catch {
          return null;
        }
      }
    };
  }

  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'product-images';
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, new DefaultAzureCredential());
  const container = service.getContainerClient(containerName);

  return {
    kind: 'azure-blob',
    async save(name, data) {
      if (!IMAGE_NAME.test(name)) throw new Error('Invalid image name');
      await container.getBlockBlobClient(name).uploadData(data, {
        blobHTTPHeaders: { blobContentType: mimeFor(name), blobCacheControl: 'public, max-age=2592000, immutable' }
      });
    },
    async open(name) {
      if (!IMAGE_NAME.test(name)) return null;
      try {
        const res = await container.getBlobClient(name).download();
        if (!res.readableStreamBody) return null;
        return {
          stream: res.readableStreamBody as Readable,
          // Always derive the type from our own extension, never from stored metadata.
          contentType: mimeFor(name),
          size: res.contentLength,
          etag: res.etag
        };
      } catch (e: any) {
        if (e?.statusCode === 404) return null;
        throw e;
      }
    }
  };
}
