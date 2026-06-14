#!/usr/bin/env node

const config = require('../dist/config').default;
const { createDb } = require('../dist/db');
const { createStorage } = require('../dist/storage');
const { imageDimensions } = require('../dist/utils');

async function main() {
  const db = createDb(config);
  const storage = createStorage(config);
  db.load();
  storage.ensure();

  const images = db.listImages({ limit: Number.MAX_SAFE_INTEGER, offset: 0, includePrivate: true });
  let scanned = 0;
  let updated = 0;
  let failed = 0;

  for (const image of images) {
    if (image.width && image.height) continue;
    scanned += 1;
    try {
      const stored = await storageForImage(image, storage).read(image);
      const dimensions = imageDimensions(stored.buffer, stored.mime || image.mime);
      if (dimensions.width && dimensions.height) {
        db.updateImage(image.id, { width: dimensions.width, height: dimensions.height });
        updated += 1;
      }
    } catch (error) {
      failed += 1;
      console.warn(`metadata backfill failed for ${image.id}: ${error.message}`);
    }
  }

  if (typeof db.close === 'function') db.close();
  console.log(JSON.stringify({ scanned, updated, failed }, null, 2));
}

function storageForImage(_image, storage) {
  return storage;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
