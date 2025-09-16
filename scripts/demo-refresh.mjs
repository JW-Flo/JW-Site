#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(step, message) {
  console.log(`\n[demo-refresh:${step}] ${message}`);
}

(async () => {
  try {
    log('reset', 'Resetting local IAM automation mock state (via API endpoint /api/demo/reset)');
    log('reset', 'If dev server is running, execute: curl -X POST http://localhost:4321/api/demo/reset');

    log('kv', 'If Cloudflare KV is configured, run `wrangler kv:key list --binding=KV` and delete onboarding keys as needed.');

    log('build', 'Rebuilding workspace (npm run build)');
    execSync('npm run build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });

    log('done', 'Demo refresh complete');
  } catch (error) {
    console.error('\n[demo-refresh:error]', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
})();
