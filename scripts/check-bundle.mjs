#!/usr/bin/env node
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(__dirname, "..");

function log(step, message) {
  console.log(`\n[bundle:${step}] ${message}`);
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      const stat = await fs.stat(fullPath);
      files.push({ path: fullPath, size: stat.size });
    }
  }
  return files;
}

const shouldBuild = process.env.CHECK_BUNDLE_SKIP_BUILD !== "1";
if (shouldBuild) {
  log("build", "Running npm run build");
  execSync("npm run build", { cwd: root, stdio: "inherit" });
}

// jw-immersive removed (migrated to console worker). Only monitor active bundles.
const targets = [
  {
    label: "platform",
    dir: path.join(root, "apps/platform/dist"),
    warn: 600 * 1024,
    fail: 1024 * 1024,
  },
];

let violations = 0;
for (const target of targets) {
  try {
    const files = await collectFiles(target.dir);
    if (files.length === 0) {
      console.warn(`[bundle:${target.label}] No files found in ${target.dir}`);
      continue;
    }
    const sorted = files.sort((a, b) => b.size - a.size);
    const top = sorted.slice(0, 10);
    console.log(`\n[bundle:${target.label}] Top assets:`);
    top.forEach(({ path: filePath, size }) => {
      const rel = path.relative(root, filePath);
      const kb = (size / 1024).toFixed(1);
      let flag = "✅";
      if (size >= target.fail) {
        flag = "❌";
      } else if (size >= target.warn) {
        flag = "⚠️";
      }
      console.log(`  ${flag} ${kb} KB  ${rel}`);
    });
    const max = sorted[0];
    if (max.size >= target.fail) {
      console.error(
        `\n[bundle:${target.label}] Largest asset exceeds ${
          target.fail / 1024
        } KB limit.`
      );
      violations += 1;
    } else if (max.size >= target.warn) {
      console.warn(
        `\n[bundle:${target.label}] Largest asset exceeds ${
          target.warn / 1024
        } KB warning threshold.`
      );
    } else {
      console.log(`\n[bundle:${target.label}] Assets within thresholds.`);
    }
  } catch (error) {
    // Log concise reason for skip to satisfy lint rule on empty catch handling
    console.warn(
      `[bundle:${target.label}] Skipping (missing dir?): ${target.dir} :: ${
        error?.message || error
      }`
    );
  }
}

if (violations > 0) {
  console.error(`\n[bundle] ${violations} target(s) exceeded limits.`);
  process.exit(1);
}

log("done", "Bundle check complete");
