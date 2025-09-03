import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

const SITE_URL = process.env.SITE_URL || "https://thewhittlewandering.com";

export default defineConfig({
  // Canonical site URL used by Astro for absolute links & sitemap
  site: SITE_URL,
  output: "server", // Enable server-side rendering for API routes
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [tailwind(), mdx(), sitemap()],
});
