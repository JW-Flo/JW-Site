import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

const SITE_URL = process.env.SITE_URL || "https://atlasit.pro";

export default defineConfig({
  site: SITE_URL,
  integrations: [tailwind()],
});
