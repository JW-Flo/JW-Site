#!/usr/bin/env node
import 'dotenv/config';

const required = [
  'SUPER_ADMIN_KEY',
  'SESSION_SIGNING_KEY',
  'CONSENT_ADMIN_KEY',
  'TURNSTILE_SECRET_KEY',
  'SITE_URL'
];

const optional = [
  'NVD_API_KEY',
  'VIRUSTOTAL_API_KEY',
  'OPENCVE_API_TOKEN',
  'OPENCVE_BASIC_USER',
  'OPENCVE_BASIC_PASSWORD',
  'CF_PAGES_PROJECT',
  'CF_PAGES_BRANCH',
  'CF_PAGES_DIST_DIR',
  'DEPLOY_HEALTHCHECK_URL'
];

function check(vars) {
  const missing = vars.filter((key) => !process.env[key] || process.env[key].length === 0);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

const ok = check(required);

if (!ok) {
  process.exit(1);
}

const missingOptional = optional.filter((key) => !process.env[key]);
if (missingOptional.length > 0) {
  console.warn(`Optional variables not set: ${missingOptional.join(', ')}`);
}

console.log('Environment validation passed.');
