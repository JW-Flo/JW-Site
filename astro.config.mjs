import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  // Canonical site URL used by Astro for absolute links & sitemap (match repo name casing)
  site: 'https://jw-flo.github.io/JW-Site',
  integrations: [tailwind(), mdx()],
});
