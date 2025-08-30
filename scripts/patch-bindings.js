#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";

const cfgPath = "wrangler.toml";
let cfg = readFileSync(cfgPath, "utf8");

const { KV_ID, D1_NAME, D1_ID, R2_BUCKET } = process.env;
let changed = false;

if (KV_ID && !cfg.match(/\bkv_namespaces\b/)) {
  cfg += `\n[[kv_namespaces]]\n` + `binding = "VISITS"\n` + `id = "${KV_ID}"\n`;
  changed = true;
}
if (D1_NAME && D1_ID && !cfg.match(/d1_databases/)) {
  cfg +=
    `\n[[d1_databases]]\n` +
    `binding = "DB"\n` +
    `database_name = "${D1_NAME}"\n` +
    `database_id = "${D1_ID}"\n`;
  changed = true;
}
if (R2_BUCKET && !cfg.match(/r2_buckets/)) {
  cfg +=
    `\n[[r2_buckets]]\n` +
    `binding = "MEDIA"\n` +
    `bucket_name = "${R2_BUCKET}"\n`;
  changed = true;
}

if (changed) {
  writeFileSync(cfgPath, cfg);
  console.log("Patched wrangler.toml");
} else {
  console.log("No changes applied");
}
