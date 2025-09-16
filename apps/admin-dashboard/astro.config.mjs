import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  integrations: [],
  site: 'https://www.atlasit.admin.pro',
  server: {
    host: true,
    port: 4321
  }
});
