#!/usr/bin/env node
// Unified environment validation script.
import "dotenv/config";

const required = [
  "SUPER_ADMIN_KEY",
  "SESSION_SIGNING_KEY",
  "CONSENT_ADMIN_KEY",
];
const missing = required.filter(
  (k) => !process.env[k] || process.env[k].trim() === ""
);
if (missing.length) {
  console.error(`[env] Missing required secrets: ${missing.join(", ")}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`[env][warn] ${msg}`);
}
if (!process.env.SITE_URL)
  warn("SITE_URL not set (canonical links may be incorrect).");
if (!process.env.TURNSTILE_SECRET_KEY)
  warn("TURNSTILE_SECRET_KEY not set (bot protection disabled).");
if (!process.env.VIRUSTOTAL_API_KEY)
  warn("VIRUSTOTAL_API_KEY not set – threat intel placeholder only.");
if ((process.env.OPENCVE_ENRICH || "").toLowerCase() === "true") {
  const hasBasic =
    (process.env.OPENCVE_USERNAME && process.env.OPENCVE_PASSWORD) ||
    (process.env.OPENCVE_BASIC_USER && process.env.OPENCVE_BASIC_PASSWORD);
  const hasToken = process.env.OPENCVE_API_TOKEN;
  if (!hasBasic && !hasToken)
    warn(
      "OPENCVE_ENRICH enabled but no OpenCVE credentials (fallback counts used)."
    );
}
console.log("[env] Environment validation passed.");
