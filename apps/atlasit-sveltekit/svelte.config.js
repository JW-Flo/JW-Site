import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Configure for Cloudflare Pages/Workers. "pages: true" targets Pages. Remove it to target Workers directly.
		adapter: adapter({
			pages: true, // output to .svelte-kit/cloudflare for Pages
			runtime: 'edge'
		})
	}
};

export default config;
