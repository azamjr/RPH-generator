import { copyFile, readFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/server/', import.meta.url);
const config = JSON.parse(await readFile(new URL('wrangler.json', output), 'utf8'));
config.name = 'rph-generator';
config.main = 'public-worker.mjs';
config.workers_dev = true;
// Signed-in sessions and their existing D1 records stay on the personal workspace.
config.d1_databases = [];
await copyFile(new URL('public-worker.mjs', import.meta.url), new URL(config.main, output));
await writeFile(new URL('wrangler.public.json', output), JSON.stringify(config, null, 2));
