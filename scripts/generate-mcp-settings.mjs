#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
} from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import path from "path";
import matter from "gray-matter";

const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const srcDir = path.join(root, "src");
const pagesBlogDir = path.join(srcDir, "pages", "blog");
const publicDir = path.join(root, "public");
const wellKnownDir = path.join(publicDir, ".well-known");

function loadSiteMeta() {
  const siteMetaPath = path.join(srcDir, "data", "siteMeta.ts");
  const raw = readFileSync(siteMetaPath, "utf-8");
  const siteUrlMatch = raw.match(/siteUrl:\s*'([^']+)'/);
  const descriptionMatch = raw.match(/description:\s*'([^']+)'/);
  const defaultTitleMatch = raw.match(/defaultTitle:\s*'([^']+)'/);
  return {
    siteUrl: process.env.SITE_URL || siteUrlMatch?.[1],
    description: descriptionMatch?.[1],
    defaultTitle: defaultTitleMatch?.[1],
  };
}

function collectPosts() {
  if (!existsSync(pagesBlogDir)) return [];
  return readdirSync(pagesBlogDir)
    .filter((f) => /\.(md|mdx)$/.test(f) && f !== "index.astro")
    .map((f) => {
      const full = path.join(pagesBlogDir, f);
      const raw = readFileSync(full, "utf-8");
      const { data } = matter(raw);
      const slug = data.slug || f.replace(/\.(md|mdx)$/, "");
      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        pubDate: data.pubDate || null,
      };
    })
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
}

function buildSettings() {
  const site = loadSiteMeta();
  const posts = collectPosts();
  return {
    name: "JW Site MCP Context",
    site: site.siteUrl,
    description: site.description,
    updated: new Date().toISOString(),
    feeds: {
      rss: `${site.siteUrl}/rss.xml`,
      json: `${site.siteUrl}/feed.json`,
    },
    blog: posts.map((p) => ({
      slug: p.slug,
      url: `${site.siteUrl}/blog/${p.slug}/`,
      title: p.title,
      description: p.description,
      pubDate: p.pubDate,
    })),
    assets: {
      socialCard: `${site.siteUrl}/social-card.svg`,
    },
    sitemap: `${site.siteUrl}/sitemap-index.xml`,
    repo: "https://github.com/JW-Flo/JW-Site",
  };
}

function main() {
  const newSettings = buildSettings();
  // Normalize blog pubDate values early
  if (Array.isArray(newSettings.blog)) {
    newSettings.blog = newSettings.blog.map((p) => ({
      ...p,
      pubDate: p.pubDate ? new Date(p.pubDate).toISOString() : null,
    }));
  }
  if (!existsSync(wellKnownDir)) mkdirSync(wellKnownDir, { recursive: true });
  const outPath = path.join(wellKnownDir, "mcp-settings.json");
  // Merge with existing if present to preserve any custom fields user may have added manually
  const merged = newSettings;
  if (existsSync(outPath)) {
    try {
      const existing = JSON.parse(readFileSync(outPath, "utf-8"));
      // Preserve unknown top-level keys not regenerated
      const keysToPreserve = Object.keys(existing).filter(
        (k) => !Object.hasOwn(newSettings, k)
      );
      for (const k of keysToPreserve) merged[k] = existing[k];
    } catch (e) {
      console.warn(
        "Warning: failed to parse existing mcp-settings.json, overwriting.",
        e && e.message ? e.message : ""
      );
    }
  }
  // Validate against schema
  try {
    const schemaPath = path.join(root, "scripts", "mcp-settings.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    if (!validate(merged)) {
      // Edge: ajv date-time format doesn't accept null though schema allows; errors already captured
      console.error("MCP settings validation errors:", validate.errors);
      process.exit(1);
    }
  } catch (e) {
    console.warn(
      "Schema validation skipped (error loading schema):",
      e.message
    );
  }
  // Normalize pubDate values to ISO strings or null
  if (Array.isArray(merged.blog)) {
    merged.blog = merged.blog.map((p) => ({
      ...p,
      pubDate: p.pubDate ? new Date(p.pubDate).toISOString() : null,
    }));
  }
  merged.updated = new Date().toISOString();
  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log("Generated", outPath);
}

main();
