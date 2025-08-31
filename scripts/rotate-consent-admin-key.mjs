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
// (no path utilities needed)

// eslint-disable-next-line no-undef
const args = new Set(process.argv.slice(2));
const deploy = args.has('--deploy');
const dryRun = args.has('--dry-run');

function genKey(){
  return randomBytes(48).toString('base64'); // 64 chars typical
}

function run(cmd, opts={}){
  const [bin, ...rest] = cmd.split(/\s+/);
  const res = spawnSync(bin, rest, { stdio: 'inherit', ...opts });
  if(res.error) throw res.error;
  if(res.status !== 0) throw new Error(`Command failed: ${cmd}`);
}

function main(){
  if(dryRun){
    console.log('[DRY RUN] Would generate a new key and execute: npx wrangler pages secret put CONSENT_ADMIN_KEY --project-name jw-site');
    if(deploy) console.log('[DRY RUN] Would also run: npm run build && npm run deploy');
    return;
  }
  const key = genKey();
  console.log('New CONSENT_ADMIN_KEY (store this NOW):');
  console.log(key);
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

main();
