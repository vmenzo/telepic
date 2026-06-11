const fs = require('fs');
const path = require('path');

function settingsPath(config) {
  return path.join(config.dataDir, 'settings.json');
}

function readSettings(config) {
  const filePath = settingsPath(config);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeSettings(config, settings) {
  const filePath = settingsPath(config);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
}

function ensureAlbums(settings) {
  settings.albums ||= [];
  return settings.albums;
}

function ensureRecycleBin(settings) {
  settings.recycleBin ||= [];
  return settings.recycleBin;
}

function findAlbum(settings, id) {
  return ensureAlbums(settings).find((album) => String(album.id) === String(id));
}

function removeImagesFromAlbums(settings, ids) {
  const removal = new Set(ids.map(String));
  for (const album of ensureAlbums(settings)) {
    album.imageIds = (album.imageIds || []).filter((id) => !removal.has(String(id)));
    if (album.coverImageId && removal.has(String(album.coverImageId))) {
      album.coverImageId = album.imageIds[0] || '';
    }
    album.updatedAt = new Date().toISOString();
  }
}

function moveImageToRecycleBin(config, image, actor) {
  const settings = readSettings(config);
  const recycleBin = ensureRecycleBin(settings);
  recycleBin.unshift({
    ...image,
    deletedAt: new Date().toISOString(),
    deletedBy: actor || 'admin'
  });
  settings.updatedAt = new Date().toISOString();
  writeSettings(config, settings);
}

function restoreTrashItem(config, db, id, actor) {
  const settings = readSettings(config);
  const recycleBin = ensureRecycleBin(settings);
  const index = recycleBin.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;
  const [item] = recycleBin.splice(index, 1);
  delete item.deletedAt;
  delete item.deletedBy;
  db.addImage(item);
  settings.updatedAt = new Date().toISOString();
  writeSettings(config, settings);
  return item;
}

async function permanentlyDeleteTrashItem(config, storage, id) {
  const settings = readSettings(config);
  const recycleBin = ensureRecycleBin(settings);
  const index = recycleBin.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;
  const [item] = recycleBin.splice(index, 1);
  await storage.delete(item);
  removeImagesFromAlbums(settings, [item.id]);
  settings.updatedAt = new Date().toISOString();
  writeSettings(config, settings);
  return item;
}

module.exports = {
  ensureAlbums,
  ensureRecycleBin,
  findAlbum,
  moveImageToRecycleBin,
  permanentlyDeleteTrashItem,
  readSettings,
  removeImagesFromAlbums,
  restoreTrashItem,
  settingsPath,
  writeSettings
};
