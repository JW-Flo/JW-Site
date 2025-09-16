#!/usr/bin/env node
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = process.env.CF_PAGES_PROJECT;
const branch = process.env.CF_PAGES_BRANCH ?? "main";
const dist = process.env.CF_PAGES_DIST_DIR ?? "apps/platform/dist";
const healthUrl =
  process.env.DEPLOY_HEALTHCHECK_URL ?? "https://www.atlasit.pro/api/health";

function log(step, message) {
  console.log(`\n[deploy:${step}] ${message}`);
}

if (!project) {
  console.error(
    "[deploy:error] CF_PAGES_PROJECT is required to run this script."
  );
  process.exit(1);
}

(async () => {
  try {
    log("env", "Validating required environment variables");
    execSync("node scripts/validate-env.mjs", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });

    log("build", "Building workspace");
    execSync("npm run build", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });

    log("deploy", `Deploying ${dist} to project ${project} (branch ${branch})`);
    execSync(
      `npx wrangler pages deploy ${dist} --project-name ${project} --branch=${branch}`,
      {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
      }
    );

    log("health", `Checking ${healthUrl}`);
    await new Promise((resolve, reject) => {
      fetch(healthUrl)
        .then((res) => {
          if (!res.ok) {
            reject(
              new Error(`Health check failed: ${res.status} ${res.statusText}`)
            );
            return;
          }
          log("health", "Health check succeeded");
          resolve();
        })
        .catch((err) =>
          reject(new Error(`Health check request failed: ${err.message}`))
        );
    });
    log("done", "Deployment complete");
  } catch (error) {
    console.error(
      "\n[deploy:error]",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
})();
