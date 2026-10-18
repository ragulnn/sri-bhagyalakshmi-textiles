import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  createImageStore,
  IMAGE_NAME,
  mimeFor
} from '../storage.js';

const originalAccount = process.env.AZURE_STORAGE_ACCOUNT;
const originalContainer = process.env.AZURE_STORAGE_CONTAINER;
const tempDirs: string[] = [];

function temporaryDirectory() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sbt-storage-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  if (originalAccount === undefined) delete process.env.AZURE_STORAGE_ACCOUNT;
  else process.env.AZURE_STORAGE_ACCOUNT = originalAccount;

  if (originalContainer === undefined) delete process.env.AZURE_STORAGE_CONTAINER;
  else process.env.AZURE_STORAGE_CONTAINER = originalContainer;

  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('IMAGE_NAME accepts generated image names only', () => {
  assert.equal(IMAGE_NAME.test('0123456789abcdef01234567.jpg'), true);
  assert.equal(IMAGE_NAME.test('0123456789abcdef01234567.webp'), true);
  assert.equal(IMAGE_NAME.test('../secret.jpg'), false);
  assert.equal(IMAGE_NAME.test('photo.jpg'), false);
});

test('mimeFor maps supported image extensions and falls back safely', () => {
  assert.equal(mimeFor('photo.jpg'), 'image/jpeg');
  assert.equal(mimeFor('photo.png'), 'image/png');
  assert.equal(mimeFor('photo.gif'), 'image/gif');
  assert.equal(mimeFor('photo.webp'), 'image/webp');
  assert.equal(mimeFor('photo.svg'), 'application/octet-stream');
});

test('local image store saves and opens an image', async () => {
  delete process.env.AZURE_STORAGE_ACCOUNT;

  const dir = temporaryDirectory();
  const store = createImageStore(dir);
  const name = '0123456789abcdef01234567.png';
  const data = Buffer.from('test image bytes');

  assert.equal(store.kind, 'local');

  await store.save(name, data);

  const image = await store.open(name);
  assert.ok(image);
  assert.equal(image.contentType, 'image/png');
  assert.equal(image.size, data.length);

  const chunks: Buffer[] = [];
  for await (const chunk of image.stream) {
    chunks.push(Buffer.from(chunk));
  }
  assert.deepEqual(Buffer.concat(chunks), data);
});

test('local image store rejects invalid names when saving', async () => {
  delete process.env.AZURE_STORAGE_ACCOUNT;

  const store = createImageStore(temporaryDirectory());

  await assert.rejects(
    store.save('../secret.jpg', Buffer.from('bad')),
    /Invalid image name/
  );
});

test('local image store returns null for invalid or missing images', async () => {
  delete process.env.AZURE_STORAGE_ACCOUNT;

  const store = createImageStore(temporaryDirectory());

  assert.equal(await store.open('../secret.jpg'), null);
  assert.equal(await store.open('0123456789abcdef01234567.jpg'), null);
});

test('Azure image store uploads with the correct content type and cache headers', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';
  process.env.AZURE_STORAGE_CONTAINER = 'test-images';

  let requestedAccount = '';
  let requestedContainer = '';
  let uploadedName = '';
  let uploadedData: Buffer | undefined;
  let uploadedOptions: any;

  const store = createImageStore(temporaryDirectory(), {
    getContainerClient(account, containerName) {
      requestedAccount = account;
      requestedContainer = containerName;
      return {
        getBlockBlobClient(name) {
          return {
            async uploadData(data, options) {
              uploadedName = name;
              uploadedData = data;
              uploadedOptions = options;
            }
          };
        },
        getBlobClient() {
          return {
            async download() {
              return {};
            }
          };
        }
      };
    }
  });

  const name = '0123456789abcdef01234567.png';
  const data = Buffer.from('fake azure image');

  assert.equal(store.kind, 'azure-blob');
  await store.save(name, data);

  assert.equal(requestedAccount, 'testaccount');
  assert.equal(requestedContainer, 'test-images');
  assert.equal(uploadedName, name);
  assert.deepEqual(uploadedData, data);
  assert.equal(uploadedOptions.blobHTTPHeaders.blobContentType, 'image/png');
  assert.equal(
    uploadedOptions.blobHTTPHeaders.blobCacheControl,
    'public, max-age=2592000, immutable'
  );
});

test('Azure image store rejects invalid upload names', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';

  const store = createImageStore(temporaryDirectory(), {
    getContainerClient() {
      return {
        getBlockBlobClient() {
          return { async uploadData() { throw new Error('Should not upload'); } };
        },
        getBlobClient() {
          return { async download() { return {}; } };
        }
      };
    }
  });

  await assert.rejects(
    store.save('../secret.jpg', Buffer.from('bad')),
    /Invalid image name/
  );
});

test('Azure image store opens a downloaded blob and derives MIME from its filename', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';
  const data = Buffer.from('fake downloaded image');
  let downloadedName = '';

  const store = createImageStore(temporaryDirectory(), {
    getContainerClient() {
      return {
        getBlockBlobClient() {
          return { async uploadData() {} };
        },
        getBlobClient(name) {
          downloadedName = name;
          return {
            async download() {
              return {
                readableStreamBody: Readable.from([data]),
                contentLength: data.length,
                etag: '"test-etag"'
              };
            }
          };
        }
      };
    }
  });

  const name = '0123456789abcdef01234567.webp';
  const image = await store.open(name);

  assert.ok(image);
  assert.equal(downloadedName, name);
  assert.equal(image.contentType, 'image/webp');
  assert.equal(image.size, data.length);
  assert.equal(image.etag, '"test-etag"');

  const chunks: Buffer[] = [];
  for await (const chunk of image.stream) chunks.push(Buffer.from(chunk));
  assert.deepEqual(Buffer.concat(chunks), data);
});

test('Azure image store returns null for invalid names and missing blobs', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';

  const store = createImageStore(temporaryDirectory(), {
    getContainerClient() {
      return {
        getBlockBlobClient() {
          return { async uploadData() {} };
        },
        getBlobClient() {
          return {
            async download() {
              const error: any = new Error('Not found');
              error.statusCode = 404;
              throw error;
            }
          };
        }
      };
    }
  });

  assert.equal(await store.open('../secret.jpg'), null);
  assert.equal(await store.open('0123456789abcdef01234567.jpg'), null);
});

test('Azure image store returns null when a download has no readable stream', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';

  const store = createImageStore(temporaryDirectory(), {
    getContainerClient() {
      return {
        getBlockBlobClient() {
          return { async uploadData() {} };
        },
        getBlobClient() {
          return { async download() { return { readableStreamBody: null }; } };
        }
      };
    }
  });

  assert.equal(await store.open('0123456789abcdef01234567.jpg'), null);
});

test('Azure image store propagates non-404 download errors', async () => {
  process.env.AZURE_STORAGE_ACCOUNT = 'testaccount';

  const store = createImageStore(temporaryDirectory(), {
    getContainerClient() {
      return {
        getBlockBlobClient() {
          return { async uploadData() {} };
        },
        getBlobClient() {
          return {
            async download() {
              throw new Error('Azure unavailable');
            }
          };
        }
      };
    }
  });

  await assert.rejects(
    store.open('0123456789abcdef01234567.jpg'),
    /Azure unavailable/
  );
});
