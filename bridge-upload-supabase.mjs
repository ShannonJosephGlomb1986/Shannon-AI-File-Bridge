import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUTPUT_DIR = path.resolve(process.env.BRIDGE_OUTPUT_DIR || 'bridge-output');
const BUCKET = 'bridge-files';
const SOURCE = 'proton-public-share';

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is missing');
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

const jsonHeaders = {
  ...headers,
  'Content-Type': 'application/json',
};

const responseText = async (response) => {
  const text = await response.text();
  return text || response.statusText || '';
};

async function supabaseRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await responseText(response);
    throw new Error(`Supabase request failed (${response.status}): ${body.slice(0, 1000)}`);
  }

  return response;
}

function contentTypeFor(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    '.xls': 'application/vnd.ms-excel',
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.zip': 'application/zip',
  };
  return types[ext] || 'application/octet-stream';
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = await fs.readFile(filePath);
  hash.update(data);
  return { hash: hash.digest('hex'), size: data.length, data };
}

function storageObjectPath(storagePath) {
  return storagePath
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

async function createRun(filesSeen) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/bridge_runs`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      Prefer: 'return=representation',
    },
    body: JSON.stringify([{
      source: SOURCE,
      status: 'running',
      files_seen: filesSeen,
    }]),
  });

  if (!response.ok) {
    const body = await responseText(response);
    throw new Error(`Unable to create bridge run (${response.status}): ${body.slice(0, 1000)}`);
  }

  const rows = await response.json();
  if (!rows?.[0]?.id) throw new Error('Supabase did not return a bridge run id');
  return rows[0].id;
}

async function updateRun(runId, patch) {
  await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/bridge_runs?id=eq.${encodeURIComponent(runId)}`,
    {
      method: 'PATCH',
      headers: {
        ...jsonHeaders,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    }
  );
}

async function findExisting(storagePath) {
  const params = new URLSearchParams({
    select: 'id,sha256,status,size_bytes',
    storage_path: `eq.${storagePath}`,
    limit: '1',
  });

  const response = await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/bridge_files?${params.toString()}`
  );

  const rows = await response.json();
  return rows?.[0] || null;
}

async function insertFile(row) {
  await supabaseRequest(`${SUPABASE_URL}/rest/v1/bridge_files`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify([row]),
  });
}

async function updateFile(id, patch) {
  await supabaseRequest(
    `${SUPABASE_URL}/rest/v1/bridge_files?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        ...jsonHeaders,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    }
  );
}

async function uploadObject(storagePath, data, contentType) {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storageObjectPath(storagePath)}`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: data,
    }
  );

  if (!response.ok) {
    const body = await responseText(response);
    throw new Error(`Storage upload failed (${response.status}): ${body.slice(0, 1000)}`);
  }
}

const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
const files = entries
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => !name.endsWith('.png') && !name.endsWith('.txt'))
  .sort();

console.log(`Supabase publish starting. Files discovered: ${files.length}`);

if (files.length === 0) {
  console.log('No transferable files found in bridge-output.');
  process.exit(0);
}

const runId = await createRun(files.length);
let downloadedCount = 0;
let uploadedCount = 0;
let errorCount = 0;

console.log('Bridge run id:', runId);

try {
  for (const fileName of files) {
    const localPath = path.join(OUTPUT_DIR, fileName);
    const { hash, size, data } = await sha256File(localPath);
    const storagePath = `proton/${fileName}`;
    const contentType = contentTypeFor(fileName);

    console.log(`Processing: ${fileName} (${size} bytes, sha256 ${hash})`);

    downloadedCount += 1;

    const existing = await findExisting(storagePath);

    if (existing?.sha256 === hash) {
      await updateFile(existing.id, {
        status: 'unchanged',
        last_seen_at: new Date().toISOString(),
        error_message: null,
      });
      console.log('Unchanged: existing Supabase copy is identical.');
      continue;
    }

    await uploadObject(storagePath, data, contentType);
    uploadedCount += 1;

    const fileRow = {
      run_id: runId,
      source: SOURCE,
      source_path: fileName,
      source_id: null,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      original_filename: fileName,
      content_type: contentType,
      size_bytes: size,
      sha256: hash,
      status: 'stored',
      last_seen_at: new Date().toISOString(),
      stored_at: new Date().toISOString(),
      error_message: null,
      metadata: {
        bridge_version: 2,
      },
    };

    if (existing?.id) {
      await updateFile(existing.id, fileRow);
    } else {
      await insertFile(fileRow);
    }

    console.log('Stored:', storagePath);
  }

  const completedAt = new Date().toISOString();
  await updateRun(runId, {
    completed_at: completedAt,
    status: errorCount ? 'partial' : 'success',
    files_downloaded: downloadedCount,
    files_uploaded: uploadedCount,
    error_count: errorCount,
  });

  console.log(`Supabase publish complete. Uploaded: ${uploadedCount}; errors: ${errorCount}`);
} catch (error) {
  errorCount += 1;
  const message = String(error);
  await updateRun(runId, {
    completed_at: new Date().toISOString(),
    status: 'failed',
    files_downloaded: downloadedCount,
    files_uploaded: uploadedCount,
    error_count: errorCount,
    error_message: message.slice(0, 2000),
  });
  throw error;
}
