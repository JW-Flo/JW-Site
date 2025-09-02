#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import matter from "gray-matter";

const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const blogDir = path.join(root, "src", "pages", "blog");
const errors = [];
const slugs = new Set();

if (existsSync(blogDir)) {
  for (const file of readdirSync(blogDir)) {
    if (!/\.(md|mdx)$/.test(file) || file === "index.astro") continue;
    const raw = readFileSync(path.join(blogDir, file), "utf-8");
    const { data } = matter(raw);
    const slug = data.slug || file.replace(/\.(md|mdx)$/, "");
    if (slugs.has(slug)) errors.push(`Duplicate slug: ${slug}`);
    slugs.add(slug);
    ["title", "description", "pubDate"].forEach((k) => {
      if (!data[k]) errors.push(`${file}: missing frontmatter '${k}'`);
    });
  }
} else {
  errors.push("Blog directory missing");
}

if (!existsSync(path.join(root, "public", "social-card.svg"))) {
  errors.push("Missing public/social-card.svg");
}

if (errors.length) {
  console.error("CONTENT VALIDATION FAILED");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
} else {
  console.log("Content validation passed.");
}
