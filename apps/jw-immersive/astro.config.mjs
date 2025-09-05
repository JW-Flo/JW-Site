import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

const SITE_URL = process.env.SITE_URL || "https://atlasit.pro";

export default defineConfig({
  // Canonical site URL used by Astro for absolute links & sitemap
  site: SITE_URL,
  base: '/team/jw/immersive', // Path-based routing for immersive experience
  output: "server", // Enable server-side rendering for API routes
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [tailwind(), mdx(), sitemap()],
});
