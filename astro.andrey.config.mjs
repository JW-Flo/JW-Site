import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Separate build for andreysergeevich.me showcasing Cloudflare features.
// Use SITE_URL env specific to this project.
export default defineConfig({
  site: process.env.SITE_URL || 'https://andreysergeevich.me',
  outDir: 'dist-andrey',
  srcDir: 'src-andrey',
  integrations: [tailwind(), mdx(), sitemap()],
  build: { format: 'directory' }
});
