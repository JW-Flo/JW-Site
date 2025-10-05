# Contributing

## AI Tools

- AI is allowed with review. Follow AI_CONTRIBUTIONS.md.
- Maintain a single root lockfile; install deps from repo root using workspaces.

## Commit

- Conventional Commits required (feat, fix, chore, docs, test, refactor).
- Tag AI-assisted commits with scope `ai`: e.g. `feat(ai): port OAuth route`.

## PR Gates

- All SvelteKit routes require tests.
- Cloudflare binding changes require wrangler.toml diff + src/app.d.ts update.

## Checks

- `npm run lint` and `npm run typecheck` must pass.
- Add/adjust unit tests and Playwright specs as part of the PR.

## Security Disclosure

Report vulnerabilities privately to <security@atlasit.pro> (fallback: <joe.whittle@atlasit.pro>). Do not create public issues for security findings.
