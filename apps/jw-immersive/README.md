# Personal Site – Joe Whittle

Cybersecurity engineering portfolio + human journey context, now served via Cloudflare Pages Worker (Astro SSR) with selective edge APIs (guestbook, consent, waitlist, geo, security scanner) and hardened security headers.

## Stack

- Astro (SSR on Cloudflare Workers) + MDX
- TailwindCSS
- Cloudflare Pages / Workers Runtime
- Cloudflare KV (RATE_LIMIT, LEADERBOARD, ANALYTICS, optional SCANNER_META)
- Cloudflare D1 (guestbook entries, consent events, waitlist signups)
- Turnstile (bot mitigation for guestbook submits)
- Feature Flags (server evaluated, safe projection to client)

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

- Minimal attack surface (small set of narrowly-scoped edge functions)
- Single JSON resume source of truth
- Principle of least privilege for data (only store what is required; IPs hashed, no raw PII in scanner metadata)
- Strong default security headers (CSP nonce, HSTS, COOP/COEP/CORP, Permissions Policy, Frame Deny)
- Rate limit externally reachable mutation/read endpoints
- Defense-in-depth; fall back fast & quietly on auth failures (404 for hidden admin endpoints)
- Simple, readable code

Historical note: Earlier iteration was fully static (“no backend”). The project now purposefully includes a controlled backend surface (D1 + KV) to enable interactive features while maintaining a constrained threat profile.

---

## Security & Hardening Overview

Implemented layers:

1. Content Security Policy: Per-request nonce for the single inline bootstrap script; `script-src 'self' 'nonce-<random>';` removed `unsafe-inline` for scripts. (Style tightening pending; currently still allows Tailwind-generated inline style usage.)
2. HTTP Response Headers: HSTS (2y, preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy minimized, COOP/COEP/CORP isolation, SameSite=Lax cookies.
3. Signed Cookies: `escan_s` (session correlation) & `escan_role` (super-admin elevation) HMAC-signed with `SESSION_SIGNING_KEY` / role issuance secret; HttpOnly, Secure.
4. Rate Limiting (KV-backed token bucket): Applied to elevation, geo, consent, guestbook (GET & POST), waitlist (GET & POST). Returns HTTP 429 with JSON `{ ok: false, error: 'rate_limited' }` and standard headers when exceeded.
5. Request Observability: `X-Request-ID` header + structured JSON log line + `Server-Timing` metrics for latency insight.
6. Privacy Controls: IP hashing before persistence (waitlist, consent events); scanner metadata gated by explicit consent flags (analytics / research) and not yet persisted unless SCANNER_META enabled.
7. Feature Flags: Evaluated server-side; only a minimal set of non-sensitive booleans exposed through the nonce-protected inline script.
8. Build Integrity (future): Plan to enforce active build ID via KV to invalidate stale preview deployments.

Deferred / Backlog:

- Remove `unsafe-inline` from style-src by extracting critical styles or adopting hashed styles.
- Migrate enhanced security scanner limiter to KV (currently in-memory) for consistent horizontal behavior.
- Stale deployment guard (ACTIVE_BUILD_ID in KV) enforcement.
- Key rotation automation (dual-key grace window).
- External log sink / metrics aggregation.

---

## Rate Limiting Details

Current quotas (subject to tuning):

- `/api/super-admin-elevate`: 5 per 10 minutes per IP
- `/api/geo`: 30 per minute per IP
- `/api/consent`: 10 per 5 minutes per IP
- `/api/guestbook` (GET recent): 60 per minute per IP
- `/api/guestbook` (POST submit): 5 per 10 minutes per IP
- `/api/waitlist` (GET): 30 per minute per IP
- `/api/waitlist` (POST join): 5 per hour per IP

Response headers (example):

```text
RateLimit-Limit: 60;w=60
RateLimit-Remaining: 42
RateLimit-Reset: 23
```

On exhaustion: HTTP 429 with the same headers and JSON body.

---

## Environment Variables & Secrets

| Name | Type | Purpose | Notes |
|------|------|---------|-------|
| SITE_URL | Config | Canonical site origin | Used in feeds & canonical links |
| SUPER_ADMIN_KEY | Secret | Enables super-admin mode in enhanced scanner | Set only in dashboard; not committed |
| CONSENT_ADMIN_KEY | Secret | Auth for `/api/admin/consent-stats` | 404 on mismatch; rotate periodically |
| SESSION_SIGNING_KEY | Secret | HMAC signing for `escan_s` cookie | Required for session integrity |
| ROLE_SIGNING_KEY | Secret | Distinct signer for role elevation cookie | Falls back to SESSION_SIGNING_KEY if unset |
| VERIFICATION_PUBKEY | Public Config | Public key for identity proof (ed25519) | Used on /verification page & DNS TXT |
| VERIFICATION_SIGNATURE | Secret | Signature over identity assertion statement | Displayed only when both pubkey + signature set |
| FEATURE_WAITLIST | Flag | Enable waitlist endpoints & widget | Requires migration 002_waitlist.sql |
| FEATURE_CONSENT_D1 | Flag | Enable consent D1 persistence | If false, consent writes disabled |
| FEATURE_GEO_CLASSIFICATION | Flag | Enable geo hashing output | Controls additional geo-derived data |
| PUBLIC_TURNSTILE_SITE_KEY | Public Config | Client Turnstile rendering | Public value safe to expose |
| TURNSTILE_SECRET_KEY | Secret | Server verify Turnstile tokens | Keep secret |
| ACTIVE_BUILD_ID (planned) | Future Config | Stale deploy invalidation gate | Not yet implemented |

Secrets should be configured in the Cloudflare Pages dashboard (Production + Preview). Only non-sensitive defaults may appear in `wrangler.toml` for local dev.

### Quick Setup Checklist

1. Copy `.env.example` to `.env` for local development and adjust placeholder secrets.
2. In Cloudflare Pages project settings, add (Secrets): `SUPER_ADMIN_KEY`, `SESSION_SIGNING_KEY`, `CONSENT_ADMIN_KEY`, `GEO_HASH_KEY`, optionally `ROLE_SIGNING_KEY`, `NVD_API_KEY`, `VIRUSTOTAL_API_KEY`, `OPENCVE_API_TOKEN` or `OPENCVE_BASIC_USER` / `OPENCVE_BASIC_PASSWORD`.
3. Add (Plain text build vars): `SITE_URL`, `FEATURE_CONSENT_D1`, `FEATURE_GEO_CLASSIFICATION`, `FEATURE_WAITLIST`, `FEATURE_AGENT`, `OPENCVE_ENRICH`.
4. (Optional) Turnstile: `PUBLIC_TURNSTILE_SITE_KEY` (plain), `TURNSTILE_SECRET_KEY` (secret).
5. (Optional) Analytics / research: `ANALYTICS_WEBHOOK_URL`, `ANALYTICS_API_KEY`, `SECURITY_RESEARCH_ENDPOINT`, `RESEARCH_API_KEY`.
6. Create KV namespaces if needed: `RATE_LIMIT`, `LEADERBOARD`, `ANALYTICS` (already present), optional `SESSION` (for persistent session storage) and `SCANNER_META` (for scan metadata). Update `wrangler.toml` with resulting IDs.
7. (Optional) D1 migrations: run `npm run db:migrate` after ensuring `DB` binding present.
8. Redeploy with Wrangler (`npm run deploy`) or push to main to trigger Pages build.
9. Verify `/api/scanner-health` shows expected *_PRESENT flags.
10. (Optional) Identity proof: set `VERIFICATION_PUBKEY` + `VERIFICATION_SIGNATURE` and redeploy; confirm /verification renders DNS TXT line.

See comments in `wrangler.toml` and `.env.example` for guidance. Avoid committing real secrets; rotate periodically.

### Identity Verification Proof

The `/verification` page can publish a cryptographic assertion of domain control.

1. Generate an ed25519 keypair locally (Node >= 19):

```bash
node -e "const { generateKeyPairSync, sign } = require('crypto'); const { publicKey, privateKey } = generateKeyPairSync('ed25519'); const stmt='I, Joe Whittle (\"Andrey Sergeevich\" professionally), assert control over the domain andreysergeevich.me for portfolio and identity verification purposes.'; const sig=sign(null, Buffer.from(stmt), privateKey).toString('base64'); const pub=publicKey.export({format:'der',type:'spki'}).toString('base64'); console.log('VERIFICATION_PUBKEY='+pub); console.log('VERIFICATION_SIGNATURE='+sig);"
```

2. Add the printed values to Cloudflare Pages env vars `VERIFICATION_PUBKEY` & `VERIFICATION_SIGNATURE` (Signature is treated as secret).
3. Redeploy and visit `/verification` – a DNS TXT record suggestion plus the signed statement appears.
4. (Optional) Publish the TXT record: `_identity.andreysergeevich.me  v=proof;id=joseph-whittle;alg=ed25519;pub=<pub>;sig=<sig>`

If the variables are absent the page shows a non-intrusive notice instead of a placeholder signature.

---

## Architecture Reference

See `ARCHITECTURE.md` for diagrams (ASCII + Mermaid), data flow, and future enhancement backlog. That document is the authoritative source for component relationships.

---

## Deployment QA Checklist

Run after staging & before promoting to production:

1. Headers: `curl -I https://staging.example` → confirm CSP present with per-request nonce, HSTS, Frame deny, Permissions-Policy, COOP/COEP.
2. CSP Nonce Validity: Load page; ensure inline bootstrap script has a nonce attribute matching CSP header value.
3. Rate Limits: Hit `/api/geo` >30 times quickly → receive 429 with RateLimit headers.
4. Health Endpoint: `curl /api/health` → verify commit hash matches latest main branch commit.
5. Guestbook Submit: Valid Turnstile token path returns 200 and appears in GET list; exceeding quota yields 429.
6. Super Admin Elevation: POST to `/api/super-admin-elevate` with wrong key → fast failure; correct key issues role cookie.
7. Admin Consent Stats: GET with missing/incorrect `X-Admin-Key` returns 404; with correct key returns stats JSON.
8. Waitlist (if enabled): Duplicate email returns `{ ok: true, duplicate: true }` without error.
9. Security Scanner: Super-admin mode only accessible when SUPER_ADMIN_KEY set; role cookie not present otherwise.
10. Logs (Preview via Wrangler): Confirm structured JSON lines with request IDs & server timing.

Optional Automated Script Idea: A future `scripts/qa.sh` can encapsulate these checks.

---

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

#### Arcade Hint & Easter Egg System

The arcade now includes a lightweight, progressively‑layered hint system that surfaces subtle clues to encourage deeper engagement (play additional games, improve scores, explore security tooling).

Core concepts:

- Segmentation: Visitors are bucketed client‑side (no PII) by total accumulated score + achievements into tiers: `visitor`, `novice`, `competent`, `advanced`.
- Hint Rotation: A single contextual hint line may appear in the menu (below the standard instructions). Hints are drawn from a per‑segment pool and are not repeated until the pool is exhausted (per local browser).
- Persistence: `localStorage` keys track total score (already used by the arcade), seen hints (`retroArcadeSeenHints`), and an internal `secretProgress` counter (`retroArcadeSecretProgress`). No network calls or server storage are used.
- Resilience: If the hint module fails to load or throws, the menu silently omits hints (defensive `try / catch`).

File:

- `public/arcadeHints.js` exports:
  - `getArcadeHint()` – returns a `{ text, segment }` object or `null` if no new hint is available.
  - `incrementSecretProgress(n = 1)` – increments an internal counter (future unlock triggers / meta puzzles).

Menu Integration:

- `MenuGame.drawInstructions()` calls `window.ArcadeHints?.getArcadeHint()` once per render cadence (with basic timestamp throttling) and appends the returned hint text if present.

Adding / Editing Hints:

1. Open `public/arcadeHints.js`.
2. Modify the `HINTS` dictionary (arrays keyed by segment).
3. Keep hints short (<= 80 chars) to avoid wrapping on narrow devices.

Using Secret Progress (example inside a game module):

```js
// Award hidden progress when player performs a special action
import './arcadeHints.js'; // ensure global is registered (or rely on existing load)
window.ArcadeHints?.incrementSecretProgress(2);
```

Potential Extension Channels (backlog):

- HTTP Response Header: Inject a low‑value, rotating `X-Arcade-Hint` header on arcade asset requests (disabled by default) for users inspecting network traffic.
- Achievements Overlay: Display a transient toast when secret progress crosses thresholds (e.g., 5, 10, 20) to tease deeper layers.
- Alternate Medium: Encode a higher‑tier clue in a CSS comment or `data-` attribute gated by score tier.
- Server Metrics: (Optional) Aggregate anonymous segment counts server‑side for balancing (not implemented; would require KV or Durable Object).

Design Principles:

- Non‑intrusive: Hints never block gameplay or cover critical UI.
- Privacy‑respecting: All state local; no fingerprinting, no remote beacon.
- Progressive: Higher tiers reveal more meta / security themed clues (e.g., referencing headers, secret scanner modes) to reward sustained play.
- Fail‑safe: Failure to load or parse hints should degrade silently with zero console noise (only `console.debug`).

Removal / Disable:

- Delete `public/arcadeHints.js` and remove the call in `MenuGame.drawInstructions()` (search for `ArcadeHints`). LocalStorage keys are orphaned but harmless; optionally clear them in a migration snippet.

Roadmap (if expanded later):

- Multi‑channel delivery (headers + DOM attributes + subtle audio Morse pattern) – gated behind a feature flag.
- Challenge Chain: Sequence of hints leading to a hidden mode or scanner enhancement.
- Rate limiting / cooldown for hint fetch to reduce DOM churn on very low‑end devices (currently minimal impact).

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

#### External Security Intelligence Enrichment

The enhanced scanner optionally enriches findings with external vulnerability & reputation data. All enrichments are graceful: absence of a key/flag yields an informational finding instead of an error.

| Capability | Env Toggle / Key | Default Behavior When Missing | Notes |
|------------|------------------|--------------------------------|-------|
| NVD CVE keyword lookup | `NVD_API_KEY` | Adds info finding: enrichment skipped | Keyword search for disclosed product/version (top 5 CVEs fetched). |
| VirusTotal domain reputation | `VIRUSTOTAL_API_KEY` | Adds info finding: enrichment unavailable | Reports malicious / suspicious / harmless counts; severity escalates if malicious > 0. |
| OpenCVE keyword statistics | `OPENCVE_ENRICH=true` (no key) | Adds info finding: enrichment disabled | Public API query; override base with `OPENCVE_API_BASE` (default `https://app.opencve.io/api`). Severity scales with match count. |

Example enablement in `.env.local` (do not commit real keys):

```
NVD_API_KEY=your_nvd_key
VIRUSTOTAL_API_KEY=your_vt_key
OPENCVE_ENRICH=true
```

Operational Guidance:

- Keep requests conservative (current implementation limits CVE queries to small pages and simple keyword search) to stay within fair use.
- If rate limiting or errors occur, findings are downgraded to `warning` or `info` without failing the overall scan.
- Disable any enrichment quickly by unsetting the variable or setting `OPENCVE_ENRICH=false`.

Security Considerations:

- External lookups include only product/version keywords derived from already public response headers (no user PII).
- Keys should be configured in the Cloudflare environment, never committed.
- Future expansion (e.g., more precise CVE matching) should preserve minimal disclosure and add caching to reduce external traffic.

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

---

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

## Project Structure

```text
atlasit/
├── 📚 docs/                    # Comprehensive documentation
│   ├── api-documentation.md    # Complete API reference
│   ├── architecture.md         # System architecture
│   ├── deployment-guide.md     # Production deployment
│   └── developer-guide.md      # Development guidelines
├── 🎯 onboarding/              # AI-guided tenant setup (IMPLEMENTED)
│   ├── src/pages/api/onboarding/  # Onboarding API endpoints
│   │   ├── index.ts            # POST /api/onboarding
│   │   ├── questions.ts        # GET /api/onboarding/questions
│   │   └── [tenantId].ts       # GET /api/onboarding/:tenantId
├── 🏪 marketplace/             # App store & integrations
├── 🔐 auth/                    # Authentication service
├── 🎭 orchestrator/            # Event orchestration (MCP)
├── 🌐 api-manager/             # API gateway & routing
├── 📱 applications/            # SaaS integrations
├── 🏗️ terraform/               # Infrastructure as code
├── 🎨 ui/                      # React dashboard
├── 🔧 shared/                  # Shared utilities
├── jw-site/                    # JW personal/marketing site (CONSOLIDATED)
│   ├── src/                    # Main site source
│   │   ├── pages/
│   │   │   ├── demos/          # Cloudflare platform demos
│   │   │   ├── api/            # AtlasIT API endpoints
│   │   │   └── ...             # Standard pages
│   ├── public/                 # Static assets
│   ├── functions/              # Cloudflare functions
│   ├── workflows/              # Workflow definitions
│   └── package.json            # Dependencies and scripts
└── 📜 scripts/                 # Build & deployment scripts
```
