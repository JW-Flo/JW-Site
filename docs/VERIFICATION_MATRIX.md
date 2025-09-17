# Verification Matrix

Edge

- Hitting <https://atlasit.pro/app> returns 410/403.
- No <http://www.atlasit.pro> DNS; NXDOMAIN or 301 to apex marketing.
- WAF logs show blocks/redirects for /app/** at atlasit.pro.

Environments

- dev/stg require Cloudflare Access before /login.
- app.atlasit.app/app w/o cookie → 302 → /login (server-side).
- localStorage flags do not bypass auth.
- /marketplace renders Google and Microsoft tiles with hrefs pointing to `/api/oauth/google` and `/api/oauth/entra` respectively.
- /account/sessions lists active sessions for authenticated users and reflects revoke-one / revoke-all actions.
- /dashboard and /onboarding show Paycom-driven joiner workflows with manual steps flagged when XaaS support is missing.
- /api-manager highlights automation level, SCIM, and XaaS capabilities for each integration (Paycom should read manual/XaaS unsupported).

Cookies

- sid cookies are HttpOnly, Secure, SameSite=Strict; scoped per env domain.
- TTL 30m idle sliding; absolute 8h; rotation on refresh; invalidated on logout.

Headers

- CSP blocks inline/eval except controlled; HSTS enabled; XFO=DENY.

Observability

- Auth rejects, session create/rotate/expire logs with trace IDs.
- Metrics: 4xx/5xx rate, TTFB, p95 auth latency, rate-limit hits.

Terraform (Cloudflare)

- terraform validate passes in infra/cloudflare.
- Ruleset phase http_request_firewall_custom includes a rule that blocks paths starting with /app on atlasit.pro.
- Plan output shows only the expected ruleset and Zero Trust resources; no destructive DNS changes.

Access (Zero Trust)

- Dev and Staging Access applications exist; allowlists include the intended emails.
- If policy scoping to application is unsupported in provider, the limitation is documented in infra/cloudflare/README.md.

E2E App Gate

- Playwright test apps/atlasit-sveltekit/e2e/app-gating.spec.ts passes: unauthenticated /app redirects to /login.
- Playwright coverage (login happy path) confirms Strict+HttpOnly+Secure cookie issuance and subsequent `/app` access (pending automation).
- Future Playwright additions should exercise `/account/sessions` revocation flows and validate marketplace CTA visibility.
