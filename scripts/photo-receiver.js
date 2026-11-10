const fs = require('fs');
const http = require('http');
const path = require('path');

const DEFAULT_PORT = 8787;
const ROOT = path.join(__dirname, '..', 'computer-photos');
const PHOTOS = path.join(ROOT, 'photos');
const MAX_BODY_BYTES = 80 * 1024 * 1024;

let server = null;

function photoPath(imageName) {
  if (typeof imageName !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}\.jpe?g$/i.test(imageName)) {
    throw new Error(`Invalid image name: ${imageName}`);
  }
  const full = path.join(PHOTOS, imageName);
  if (path.basename(full) !== imageName) {
    throw new Error(`Invalid image name: ${imageName}`);
  }
  return full;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Upload is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function handleFiles(req, res) {
  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { ok: false, message: 'The computer could not read that upload.' });
    return;
  }

  fs.mkdirSync(PHOTOS, { recursive: true });
  const saved = [];

  try {
    const photos = Array.isArray(payload.photos) ? payload.photos : [];
    for (const photo of photos) {
      const destination = photoPath(photo.imageName);
      if (typeof photo.base64 !== 'string' || photo.base64.length === 0) {
        throw new Error(`Missing photo data for ${photo.imageName}`);
      }
      fs.writeFileSync(destination, Buffer.from(photo.base64, 'base64'));
      saved.push(photo.imageName);
      console.log(`Saved photo ${destination}`);
    }

    const deleteNames = Array.isArray(payload.deleteNames) ? payload.deleteNames : [];
    for (const imageName of deleteNames) {
      const destination = photoPath(imageName);
      if (fs.existsSync(destination)) {
        fs.rmSync(destination);
        console.log(`Removed photo ${destination}`);
      }
    }

    if (typeof payload.spreadsheetBase64 === 'string' && payload.spreadsheetBase64.length > 0) {
      const spreadsheet = path.join(ROOT, 'inventory.xlsx');
      fs.writeFileSync(spreadsheet, Buffer.from(payload.spreadsheetBase64, 'base64'));
      console.log(`Updated spreadsheet ${spreadsheet}`);
    }
  } catch (error) {
    sendJson(res, 400, { ok: false, message: error instanceof Error ? error.message : 'Could not save the photo.' });
    return;
  }

  sendJson(res, 200, { ok: true, folder: ROOT, saved });
}

function startPhotoReceiver(port = DEFAULT_PORT) {
  if (server) return server;

  fs.mkdirSync(PHOTOS, { recursive: true });
  server = http.createServer((req, res) => {
    const url = req.url?.split('?')[0];
    if (req.method === 'GET' && url === '/health') {
      sendJson(res, 200, { ok: true, folder: ROOT });
      return;
    }
    if (req.method === 'POST' && url === '/files') {
      void handleFiles(req, res);
      return;
    }
    sendJson(res, 404, { ok: false, message: 'Not found' });
  });

  server.on('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      console.log(`Photo folder is already receiving on port ${port}.`);
      return;
    }
    console.error(error);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Product photos will be saved to ${PHOTOS}`);
  });

  return server;
}

function stopPhotoReceiver() {
  const current = server;
  server = null;
  if (!current) return Promise.resolve();
  return new Promise((resolve, reject) => {
    current.close((error) => (error ? reject(error) : resolve()));
  });
}

module.exports = {
  DEFAULT_PORT,
  ROOT,
  PHOTOS,
  startPhotoReceiver,
  stopPhotoReceiver,
};
