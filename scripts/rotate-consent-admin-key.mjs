#!/usr/bin/env node
/**
 * Rotate the CONSENT_ADMIN_KEY secret for Cloudflare Pages.
 *
 * Usage:
 *   node scripts/rotate-consent-admin-key.mjs            # generate & set new key (prompts wrangler to upload)
 *   node scripts/rotate-consent-admin-key.mjs --deploy   # rotate then build & deploy
 *   node scripts/rotate-consent-admin-key.mjs --dry-run  # show what would happen (no changes)
 *
 * The generated key is printed to stdout ONCE. Store it in a password manager.
 */
import { randomBytes } from 'crypto';
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, chmodSync } from 'fs';
// (no path utilities needed)

// eslint-disable-next-line no-undef
const args = new Set(process.argv.slice(2));
const deploy = args.has('--deploy');
const dryRun = args.has('--dry-run');
const noStore = args.has('--no-store');
// Optional custom output file path
let customOut;
for (const a of args){
  if(a.startsWith('--output=')) customOut = a.split('=')[1];
}

// Storage locations (project-local .secrets directory by default)
const secretsDir = '.secrets';
const latestFile = customOut || `${secretsDir}/CONSENT_ADMIN_KEY.latest`; // contains only current key
const historyFile = `${secretsDir}/CONSENT_ADMIN_KEY.history`; // append JSONL rotation history

function genKey(){
  return randomBytes(48).toString('base64'); // 64 chars typical
}

function run(cmd, opts={}){
  const [bin, ...rest] = cmd.split(/\s+/);
  const res = spawnSync(bin, rest, { stdio: 'inherit', ...opts });
  if(res.error) throw res.error;
  if(res.status !== 0) throw new Error(`Command failed: ${cmd}`);
}

function logDryRun(){
  console.log('[DRY RUN] Would generate a new key and execute: npx wrangler pages secret put CONSENT_ADMIN_KEY --project-name jw-site');
  if(!noStore){
    console.log(`[DRY RUN] Would create directory ${secretsDir} (if missing) and write:`);
    console.log(`  - ${latestFile} (0600) containing the new key`);
    console.log(`  - ${historyFile} (append JSON line with timestamp + partial key)`);
  } else {
    console.log('[DRY RUN] --no-store set: would NOT write local secret files');
  }
  if(deploy) console.log('[DRY RUN] Would also run: npm run build && npm run deploy');
}

function storeKey(key){
  if(noStore){
    console.log('Skipping local storage (--no-store).');
    return;
  }
  try {
    if(!existsSync(secretsDir)) mkdirSync(secretsDir, { recursive: true });
    writeFileSync(latestFile, key + '\n', { encoding: 'utf8', mode: 0o600 });
    const entry = { ts: new Date().toISOString(), file: latestFile, preview: key.slice(0,8) + '...' };
    appendFileSync(historyFile, JSON.stringify(entry) + '\n', { encoding: 'utf8', mode: 0o600 });
    try { chmodSync(latestFile, 0o600); } catch {/* ignore */}
    try { chmodSync(historyFile, 0o600); } catch {/* ignore */}
    console.log(`Stored key locally at ${latestFile} (permissions 600). History appended.`);
  } catch(e){
    console.warn('WARNING: Failed to store key locally:', e.message);
  }
}

function setSecretAndMaybeDeploy(key){
  console.log('\nSetting secret in Cloudflare Pages...');
  const put = spawnSync('npx', ['wrangler','pages','secret','put','CONSENT_ADMIN_KEY','--project-name','jw-site'], { input: key + '\n', stdio: ['pipe','inherit','inherit'] });
  if(put.status !== 0) {
    console.error('Failed to set secret. Aborting.');
    // eslint-disable-next-line no-undef
    process.exit(put.status || 1);
  }
  console.log('Secret updated.');
  if(deploy){
    console.log('Building & deploying...');
    run('npm run build');
    run('npm run deploy');
  } else {
    console.log('Run `npm run build && npm run deploy` to activate the new key.');
  }
}

function main(){
  if(dryRun){
    logDryRun();
    return;
  }
  const key = genKey();
  console.log('New CONSENT_ADMIN_KEY (store this NOW):');
  console.log(key);
  storeKey(key);
  setSecretAndMaybeDeploy(key);
}

main();
