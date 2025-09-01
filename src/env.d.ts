/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly SUPER_ADMIN_KEY?: string;
	readonly SESSION_SIGNING_KEY?: string; // Used to sign ephemeral session cookies (HMAC)
	readonly SCANNER_META?: KVNamespace; // Optional KV namespace for minimal consent-gated scan metadata
	readonly AGENT_SESSIONS?: KVNamespace; // KV namespace for agent session persistence (optional)
	readonly AGENT_RL?: KVNamespace; // KV namespace for agent rate limiting (optional)
	readonly FEATURE_AGENT_SCHEMA?: string; // Optional feature flag to enable schema validation ("true" to enforce)
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
					AGENT_SESSIONS?: KVNamespace; // KV namespace for agent session persistence (optional)
					AGENT_RL?: KVNamespace; // KV namespace for agent rate limiting (optional)
						FEATURE_AGENT_SCHEMA?: string; // Optional feature flag to enable schema validation
				}
			}
		}
	}
}