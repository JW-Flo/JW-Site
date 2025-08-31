# Personal Site – Joe Whittle

Static, low-maintenance cybersecurity engineering portfolio + human journey context.

## Stack

- Astro + MDX
- TailwindCSS
- Cloudflare Pages (primary hosting)

## Local Development

### Option 1: Native Node.js (Recommended for development)

```bash
npm install
npm run dev
```

Site at <http://localhost:4321>

### Option 2: Docker (For consistent environments)

```bash
# Build and run with Docker Compose
npm run dev:docker

# Or manually:
docker-compose up

# Or build and run separately:
docker-compose build
docker-compose up -d
```

Site at <http://localhost:4321>

#### Docker Commands

```bash
# Start development server
npm run dev:docker

# Build Docker image
npm run docker:build

# Start in background
npm run docker:up

# Stop containers
npm run docker:down
```

Docker provides a consistent development environment across different machines and ensures all dependencies are properly isolated.

## Content Updates

- Resume: edit `src/data/resume.json`.
- Blog posts: add new `.mdx` files under `src/pages/blog/` with frontmatter.
- Projects: update array in `src/pages/projects.astro` (or later move to data file).

## Deployment (Cloudflare Pages)

You can deploy either through the Cloudflare Pages UI or locally with Wrangler.

### One-time (UI)

1. Create a new Pages project, point at this repo (or upload zip of `dist`).
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set env var `SITE_URL=https://yourdomain.tld` (no trailing slash) once domain is known.
5. After first deploy, add any custom domain; trigger a redeploy so canonical URLs + feeds update.

### Local (Wrangler CLI)

Build then deploy:

```bash
npm run build
npm run deploy:preview   # preview branch deploy
npm run deploy           # production deploy
```

During development you can iterate on the already-built output (rarely needed) with:

```bash
npm run pages:dev
```

Historical note: GitHub Pages was the initial fallback; canonical generation now expects `SITE_URL` to be set for production.

### Staging Workflow

Use a `staging` branch for pre-production validation:

1. Push feature branches & open PRs – CI builds preview deployments (Cloudflare Pages preview environment).
2. Merge into `staging` – automatic staging deploy (configure Cloudflare project to map branch `staging` to staging URL).
3. Final QA on staging URL (security headers, APIs, structured data).
4. Merge staging → main for production deploy.

### Auth (Wrangler OAuth Recommended)

Fast path:

```bash
npm run auth:login
```

What the script does: unsets any `CLOUDFLARE_API_TOKEN` (so Wrangler doesn't force token mode) then launches the browser OAuth flow (`wrangler login`). Credentials are stored under `~/.wrangler`.

Manual steps if you prefer:

```bash
unset CLOUDFLARE_API_TOKEN
npx wrangler login
wrangler whoami
```

If you previously exported a token in your shell profile, remove that line and re-source it before logging in. Avoid pasting API tokens into commits or chat.

## Principles

- Minimal attack surface (static output only)
- Single JSON resume source of truth
- No backend, no database
- Simple, readable code

## Minimal Maintenance Cheatsheet

Add a blog post:

1. Create `src/pages/blog/my-post.mdx`
2. Include frontmatter:

```mdx
---
title: My Post Title
description: Short one-line description.
pubDate: 2025-08-27
---

Content here.
```

1. Commit & push – feed & sitemap update automatically.

Update resume:

1. Edit `src/data/resume.json`
2. Commit & push.

Change canonical domain later:

1. Update `SITE_URL` env var (Cloudflare Pages > Settings > Environment Variables or wrangler.toml vars).
2. Trigger new deploy.

Customize metadata: edit `src/data/siteMeta.ts`.

Things intentionally removed (simplicity):

- Automated JSON schema validation
- MCP settings generator (static file in `public/.well-known/`)
- CI workflow & lint dependencies

Future (optional):

- Dark/light toggle
- Tag filtering for blog
- Reintroduce linting or content validation if needed

## Smoke Tests

Simple script to hit key endpoints (run while dev server is up):

```bash
chmod +x scripts/smoke.sh # first run
./scripts/smoke.sh http://localhost:4321
```

## API Endpoints (Current)

- `GET /api/guestbook` – recent guestbook entries
- `POST /api/guestbook` – add entry (Turnstile token required)
- `GET /api/guestbook/stats` – counts & latest entries
- `GET /api/geo` – Cloudflare edge geo metadata (rate limited)
- `GET /api/waitlist` – waitlist count (feature-flag: `FEATURE_WAITLIST`)
- `POST /api/waitlist` – join waitlist (feature-flag: `FEATURE_WAITLIST`)

### Retro Arcade (Games)

An original retro arcade system (Space Invaders, Tetris, Pac‑Man, Asteroids) is embedded site‑wide but intentionally subtle.

Access methods:

1. Click the floating controller button (🎮) near the top/right of any page to open the fullscreen canvas overlay.
2. Or visit `/arcade` for written instructions and details.

Controls:

- Arrow Keys for movement / menu navigation
- Space / Enter to select or fire
- Esc to exit current game and return to menu (or deactivate)

Security & Performance:

- Games load only after activation (dynamic ES module import)
- No external network calls; pure client runtime
- Canvas + keyboard listeners are fully torn down on exit

Leaderboard: Currently ephemeral (in‑memory). Future enhancement may optionally persist anonymized scores to KV (`LEADERBOARD`).

### Enhanced Security Scanner & Super Admin Mode

Two routes exist:

- `/security-scanner` (legacy / basic) – minimal version
- `/enhanced-security-scanner` – tri‑mode Business / Engineer / Super Admin lite

Super Admin Activation Steps:

1. Enter passphrase `chalant` in the passphrase field to enable the Super Admin button (client-side hash check only).
2. Click Super Admin – you will be prompted for the server `SUPER_ADMIN_KEY` (this is the actual secret configured as an environment variable in Cloudflare Pages). Paste it once; it is stored only in memory for that tab.
3. Run scans. The key is sent per request as `adminKey` only in Super Admin mode.

If the server `SUPER_ADMIN_KEY` is not set, super admin requests return an error. For production, set it in Cloudflare Pages > Settings > Environment Variables (do NOT commit to `wrangler.toml`).

Threat Model:

- Passphrase only reveals UI (low sensitivity)
- Real authorization enforced server-side by secret key comparison
- Key never persisted locally (no localStorage/sessionStorage); lives only in a JS variable for the session

### Admin Consent Metrics Portal

An intentionally unlinked, low-noise admin view for aggregated consent preferences to validate privacy UX and regional gating. Accessible at:

- Page: `/admin-consent`
- Backend API: `GET /api/admin/consent-stats`

Authentication:

Provide a single header `X-Admin-Key: <secret>` (value must match environment variable `CONSENT_ADMIN_KEY`). If the header is missing or incorrect, the API returns `404` (not `401/403`) to avoid advertising its presence.

What you see:

- Totals of consent_events rows (overall + analytics, research, marketing opt-ins)
- 25 most recent consent events (session fragment, country, individual flags)
- CSV export of the currently displayed recent events (client‑side only)

Enabling:

1. In Cloudflare Pages project > Settings > Environment Variables add a variable `CONSENT_ADMIN_KEY` with a sufficiently strong random value (>= 24 chars). Do NOT commit the value to `wrangler.toml`.
2. Redeploy. The page will then respond once the correct header is supplied.

Operational Tips:

- Rotate the key periodically; simply update the Pages variable and redeploy.
- Because the page is discoverable if someone enumerates routes, its source sets `<meta name="robots" content="noindex,nofollow"/>` and a generic title. Treat security as relying on possession of the header secret, not obscurity.
- Consider adding IP-based rate limiting in front of `/api/admin/consent-stats` later (currently small attack surface; returns 404 quickly on mismatch).
- If you temporarily want to disable access, unset `CONSENT_ADMIN_KEY` and redeploy (API will always 404; UI shows Not found).

Data Source:

Rows originate from the `consent_events` D1 table created in migration `001_consent_events.sql`. Ensure feature flag `FEATURE_CONSENT_D1` (if used) and migrations are applied so events are being inserted.

Client Behavior:

- The page stores the provided key only for the current tab session via `sessionStorage` (cleared on tab close).
- No key is logged or persisted server-side.

Threat Model Notes:

- Wrong key: indistinguishable from missing endpoint (404).
- Brute force: improbable success before rotation if key sufficiently random; add WAF/rate limits if risk appetite demands.
- Leakage: avoid pasting key into shared screenshots; use the password field provided.

To remove the portal entirely, delete `src/pages/admin-consent.astro` and redeploy.

Key Rotation Helper:

Rotate + set new admin key locally:

```bash
npm run rotate:consent-admin-key            # prints new key & sets secret (no deploy)
npm run rotate:consent-admin-key -- --deploy # rotate + build + deploy
npm run rotate:consent-admin-key -- --dry-run # show what would happen
npm run rotate:consent-admin-key -- --no-store # skip local writing of .secrets files
npm run rotate:consent-admin-key -- --output=.secrets/custom-key.txt # custom file path
```

Store the printed key immediately; it cannot be retrieved later. A rotation only becomes active after deployment.

When run normally the script now also:

- Creates a `.secrets/` directory (if missing)
- Writes the full key to `.secrets/CONSENT_ADMIN_KEY.latest` (mode 600)
- Appends a JSON line with timestamp + truncated preview to `.secrets/CONSENT_ADMIN_KEY.history`

Disable local persistence with `--no-store`.

### Waitlist Feature

The optional early‑access waitlist is disabled by default and gated by the environment variable `FEATURE_WAITLIST`.

Enable locally (ephemeral) via shell:

```bash
FEATURE_WAITLIST=true npm run dev
```

Or set in Cloudflare Pages project settings (Environment Variables) for preview / production.

Apply database migration (creates `waitlist_signups` table):

```bash
# Local (uses local D1 instance)
npm run db:migrate:local

# Remote (production binding)
npm run db:migrate
```

Schema (migration `002_waitlist.sql`):

```sql
CREATE TABLE waitlist_signups (
id INTEGER PRIMARY KEY AUTOINCREMENT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
email TEXT NOT NULL UNIQUE,
source TEXT,
marketing_consent INTEGER DEFAULT 0,
ip_hash TEXT,
hash_algo TEXT
);
```

Privacy: IP addresses are one‑way hashed with a secret (same mechanism as geo consent hashing) before storage; no raw IPs are retained. Duplicate joins return `{ ok: true, duplicate: true }` without error for smoother UX.

Widget: Renders only when `FEATURE_WAITLIST` is `true` (see `src/components/WaitlistWidget.astro`).

The previous `/demo` section has been retired. Requests to `/demo` return a 410 page. All functionality now under `/api/*`.

## License

Personal proprietary unless otherwise specified.

## Copyright Notice

© 2025 Joe Whittle. All rights reserved.

This portfolio and its contents, including but not limited to:

- Original game implementations (Space Invaders, Asteroids, Pac-Man, Tetris)
- Security automation workflows
- Resume and professional content
- Website design and code

are the intellectual property of Joe Whittle. All games are original implementations created from scratch and do not copy proprietary game code or assets.

### Game Implementations

All arcade games featured in this portfolio are original JavaScript implementations created by Joe Whittle. They are not based on or copied from any proprietary game engines, code, or assets. The games serve as:

- Interactive portfolio demonstrations
- Technical skill showcases
- Entertainment for visitors
- Examples of modern web development with security considerations

### Usage Rights

- Personal portfolio use: ✅ Permitted
- Educational reference: ✅ Permitted (with attribution)
- Commercial use: ❌ Not permitted without explicit written consent
- Code copying: ❌ Not permitted for commercial purposes

For any questions regarding usage, licensing, or collaboration opportunities, please contact via the contact form or LinkedIn.

---

## Enhanced Security Scanner – Session & Consent

The enhanced scanner issues a short-lived signed session cookie (`escan_s`) strictly for grouping a visitor's scans (HttpOnly, Secure, SameSite=Lax). It contains only a random ID + signature. Signing uses `SESSION_SIGNING_KEY` (configure as secret in Cloudflare Pages). No personal identifiers are embedded.

### Minimal Metadata Packets (KV `SCANNER_META`)

Each scan may generate a tiny JSON packet (<= ~250 bytes):

```json
{ "u": "...", "t": 1735690000000, "m": "business", "f": 12, "c": 2, "s": 87, "co": "US", "ua": "ab12cd" }
```

Field summary:

- `u` – origin + truncated path (no query, no full URL leak)
- `t` – timestamp (ms)
- `m` – mode (business | engineer | super-admin-lite)
- `f` – total findings
- `c` – critical/high finding count
- `s` – overall score (if computed)
- `co` – country code (only with research consent)
- `ua` – one-way hashed User-Agent (only with research consent)

## Deployment Invalidation / Old Builds

To reduce risk of attackers enumerating and replaying older vulnerable builds:

1. Each deployment includes an implicit commit hash (Cloudflare Pages sets env vars). `/api/health` exposes `commit` and flags.
2. A forthcoming enhancement can store the latest production `BUILD_ID` in KV. Middleware then compares local `BUILD_ID` (`src/config/build.ts`) and returns 410 for stale preview URLs if left active.
3. Periodically prune unused preview deployments (Pages Dashboard > Deployments) to eliminate backtracking surface.
4. Avoid embedding secrets in static assets; rotate keys (`SUPER_ADMIN_KEY`, `CONSENT_ADMIN_KEY`, etc.) after critical fixes.
5. Consider WAF rules to block direct access to known legacy asset paths if a severe vulnerability patch was shipped.

Operational Tip: Track security header regressions by scripting a curl-based check against `/` and `/api/health` in CI before allowing promotion to production.

### Consent Gating

Persistence occurs ONLY if a consent cookie `cc_prefs` indicates:

- Analytics: `a:1` OR Research: `r:1`
- Research implies analytics (adds `co` & `ua` fields)

No consent => No metadata persisted (scan still runs; results returned directly).

### Regional Compliance

Client code (cookie banner / CMP) must refrain from setting analytics/research consent values until explicit opt-in for users in regulated jurisdictions (EU GDPR, California). The server trusts the presence/absence of flags – ensure geo + consent logic on the client is correct.

### Environment & Bindings

- KV binding `SCANNER_META` (placeholder IDs in `wrangler.toml`) – replace with real namespace IDs.
- Secret: `SESSION_SIGNING_KEY` (HMAC signing).

### Creating the `SCANNER_META` KV Namespace

The binding is currently commented out to allow deployment without a real namespace. When ready to enable persistence:

1. Create production + preview namespaces:

```bash
wrangler kv:namespace create SCANNER_META --env=production
wrangler kv:namespace create SCANNER_META --env=preview
```

1. Copy the returned `id` and `preview_id` values into `wrangler.toml` under an uncommented block:

```toml
[[kv_namespaces]]
binding = "SCANNER_META"
id = "<prod-id>"
preview_id = "<preview-id>"
```

1. Redeploy. The scanner will begin persisting consent-gated packets.

1. (Optional) To inspect a few recent keys during development:

```bash
wrangler kv:key list --namespace-id <preview-id> | head
```

1. To purge old data manually (normally TTL handles this):

```bash
wrangler kv:key delete --namespace-id <prod-id> <key>
```

Keep namespace small; avoid adding user-identifiable data.

### Data Retention & Size

- KV entries TTL: 24h (lightweight aggregate trend window)
- No IP addresses persisted; no exact full URLs; no raw user agents.

### Extensibility

Future analytics dashboards can query aggregated counts without exposing personal data. Any schema expansion must go through updated consent documentation before deployment.

