// Run once to create the index and upload documents:
//   node scripts/seed-search.mjs
//
// Re-run any time you update knowledge.json.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const ENDPOINT = process.env.AZURE_AI_SEARCH_ENDPOINT?.replace(/\/$/, '');
const API_KEY  = process.env.AZURE_AI_SEARCH_API_KEY;
const INDEX    = process.env.AZURE_AI_SEARCH_INDEX ?? 'jan-kettler';

if (!ENDPOINT || !API_KEY) {
  console.error('Set AZURE_AI_SEARCH_ENDPOINT and AZURE_AI_SEARCH_API_KEY before running.');
  process.exit(1);
}

const API_VERSION = '2024-07-01';
const headers = {
  'Content-Type': 'application/json',
  'api-key':      API_KEY,
};

async function createIndex() {
  const schema = {
    name: INDEX,
    fields: [
      { name: 'id',      type: 'Edm.String', key: true,  searchable: false, filterable: true  },
      { name: 'title',   type: 'Edm.String', key: false, searchable: true,  filterable: false },
      { name: 'content', type: 'Edm.String', key: false, searchable: true,  filterable: false },
    ],
  };

  const res = await fetch(
    `${ENDPOINT}/indexes/${INDEX}?api-version=${API_VERSION}`,
    { method: 'PUT', headers, body: JSON.stringify(schema) },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Index creation failed (${res.status}): ${err}`);
  }
  console.log(`✓ Index "${INDEX}" ready`);
}

async function uploadDocuments(docs) {
  const batch = { value: docs.map(d => ({ '@search.action': 'mergeOrUpload', ...d })) };
  const res = await fetch(
    `${ENDPOINT}/indexes/${INDEX}/docs/index?api-version=${API_VERSION}`,
    { method: 'POST', headers, body: JSON.stringify(batch) },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed (${res.status}): ${err}`);
  }
  const result = await res.json();
  const failed = result.value?.filter(r => !r.status) ?? [];
  if (failed.length) console.warn('Failed docs:', failed);
  console.log(`✓ Uploaded ${docs.length} documents (${failed.length} failed)`);
}

const docs = JSON.parse(readFileSync(join(__dir, 'knowledge.json'), 'utf8'));
await createIndex();
await uploadDocuments(docs);
console.log('Done.');
