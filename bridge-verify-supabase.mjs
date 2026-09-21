import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUTPUT_DIR = path.resolve(process.env.BRIDGE_OUTPUT_DIR || 'bridge-output');
const BUCKET = 'bridge-files';

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is missing');
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

const headers = {
  apikey: SERVICE_KEY,
  Authorization: 'Bearer ' + SERVICE_KEY,
};

function storageObjectPath(storagePath) {
  return storagePath.split('/').map(encodeURIComponent).join('/');
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
const files = entries
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => !name.endsWith('.png') && !name.endsWith('.txt'))
  .sort();

console.log('Supabase verification starting. Files to verify: ' + files.length);

if (files.length === 0) {
  console.log('No transferable files found to verify.');
  process.exit(0);
}

let verified = 0;

for (const fileName of files) {
  const localPath = path.join(OUTPUT_DIR, fileName);
  const localBytes = await fs.readFile(localPath);
  const localHash = sha256(localBytes);
  const storagePath = 'proton/' + fileName;

  const response = await fetch(
    SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + storageObjectPath(storagePath),
    { headers }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error('Supabase download failed for ' + storagePath + ' (' + response.status + '): ' + body.slice(0, 1000));
  }

  const remoteBytes = Buffer.from(await response.arrayBuffer());
  const remoteHash = sha256(remoteBytes);

  console.log('Verify: ' + fileName);
  console.log('Local bytes: ' + localBytes.length);
  console.log('Remote bytes: ' + remoteBytes.length);
  console.log('Local SHA-256: ' + localHash);
  console.log('Remote SHA-256: ' + remoteHash);

  if (localBytes.length !== remoteBytes.length || localHash !== remoteHash) {
    throw new Error('Integrity check failed for ' + fileName);
  }

  console.log('VERIFIED: ' + storagePath);
  verified += 1;
}

console.log('Supabase verification complete. Verified: ' + verified + '; errors: 0');