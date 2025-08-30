import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

const SITE_URL = process.env.SITE_URL || "https://andreysergeevich.me";

export default defineConfig({
  // Canonical site URL used by Astro for absolute links & sitemap
  site: SITE_URL,
  integrations: [tailwind(), mdx(), sitemap()],
});
