// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: import('./lib/auth').User;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				D1_DB: D1Database;
				SESSION: KVNamespace;
				KV_ATLASIT?: KVNamespace;
				R2_BUCKET: R2Bucket;
				OAUTH_GOOGLE_CLIENT_ID: string;
				OAUTH_GOOGLE_CLIENT_SECRET: string;
				OAUTH_MICROSOFT_CLIENT_ID: string;
				OAUTH_MICROSOFT_CLIENT_SECRET: string;
				OAUTH_ENTRA_CLIENT_ID: string;
				OAUTH_ENTRA_CLIENT_SECRET: string;
				SITE_URL: string;
				JWT_SECRET: string;
			};
		}
	}
}

export {};
