import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // Andrey-specific site URL
  site: "https://andreysergeevich.me",
  outDir: "./dist-andrey",
  integrations: [tailwind(), mdx(), sitemap()],
});
