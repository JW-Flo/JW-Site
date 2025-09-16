# Performance & Architecture Review

## Current Findings

- **Bundle size warnings (awhittlewandering frontend):** `map-vendor-PoGIxJMF.js` > 1 MB (gzip ~428 KB). Consider dynamic imports for Mapbox/Maplibre chunks, lazy-loading routes, or leveraging code splitting via `build.rollupOptions.output.manualChunks`.
- **Worker output growth:** Platform demo adds additional assets, but Astro SSR build remains lightweight. Continue monitoring for drift.

## Remediation Ideas

1. Introduce lazy loading/dynamic imports for heavy map libraries.
2. Audit third-party dependencies for unused modules; remove or replace where feasible.
3. Implement automated bundle-size checks in CI (e.g., `rollup-plugin-visualizer` report or `bundlesize`).
4. Schedule quarterly reviews to evaluate architecture, security headers, and data bindings.

## Quarterly Review Checklist

- [ ] Run `npm run build` and capture bundle size report.
- [ ] Validate Cloudflare bindings (KV, D1, R2) and secrets against documentation.
- [ ] Re-run demo integration tests (`npx vitest run src/test/demoFlows.test.ts`).
- [ ] Rehearse reset + deploy scripts (`npm run demo:refresh`, `npm run deploy:production` in dry-run mode).
- [ ] Confirm documentation (`README.md`, `docs/DEMO_DATA.md`, this file) is up to date.
