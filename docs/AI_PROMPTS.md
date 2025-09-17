# Prompt Templates (Grok Fast Code)

## Port Astro route to SvelteKit endpoint

You are implementing a SvelteKit + Cloudflare Pages endpoint. Convert this Astro server route into a SvelteKit `+server.ts` endpoint.

Constraints:

- Edge runtime only, no Node APIs
- Use `event.platform.env` for bindings (typed in `src/app.d.ts`)
- Add Vitest unit test and Playwright smoke
- Use `error()` from `@sveltejs/kit` for failures

Input: paste the Astro route code here

Output: file diffs for `+server.ts`, test, and route registration.

## OAuth callback handler

Create `apps/atlasit-sveltekit/src/routes/api/oauth/[provider]/callback/+server.ts` that exchanges `code` for tokens at the provider, stores session in `KV_ATLASIT`, and redirects to `/dashboard`.

- Use Web Crypto for PKCE
- URLPattern-safe paths
- Type `App.Platform`
- Include unit test stubs

## Onboarding form

Generate a `+page.svelte` with a form that posts to `+page.server.ts`. Validate on server with zod, persist to `D1_DB`, return form actions. Add accessibility-friendly markup and Playwright form submit test.

## Marketplace listing fetcher

Create `src/lib/api/marketplace.ts` that fetches from `/api/marketplace`, caches in `caches.default` with stale-while-revalidate. Edge-safe, no node imports. Add unit test.
