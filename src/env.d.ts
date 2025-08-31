/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly SUPER_ADMIN_KEY?: string;
	readonly SESSION_SIGNING_KEY?: string; // Used to sign ephemeral session cookies (HMAC)
	readonly SCANNER_META?: KVNamespace; // Optional KV namespace for minimal consent-gated scan metadata
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Cloudflare Pages runtime environment bindings augmentation
declare global {
	namespace App {
		interface Locals {
			runtime?: {
				env?: {
					SUPER_ADMIN_KEY?: string;
					SESSION_SIGNING_KEY?: string;
					SCANNER_META?: KVNamespace; // Optional KV namespace for minimal consent-gated scan metadata
				}
			}
		}
	}
}