import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://JW-Flo.github.io/jw-site',
  integrations: [tailwind(), mdx()],
});
