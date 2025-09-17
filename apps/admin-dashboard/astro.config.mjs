import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [tailwind()],
  site: "https://admin.atlasit.pro",
  server: {
    host: true,
    port: 4321,
  },
});
