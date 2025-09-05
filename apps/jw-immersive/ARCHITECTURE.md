# Architecture Overview

## High-Level Components

```text
Browser (User)
  | HTTP(S)
  v
Cloudflare Pages / Worker (Astro SSR)
  - Middleware: CSP nonce, security headers, request ID, server timing
  - Routes / API Handlers
      * /api/super-admin-elevate (role cookie issuance + rate limit)
      * /api/geo (geo/IP privacy) (rate limited)
      * /api/consent (stores consent event) (rate limited)
      * /api/guestbook (Turnstile + game score verification) (rate limited)
      * /api/waitlist (email signup + IP hash) (rate limited)
      * /api/enhanced-security-scan (in-memory limiter) (future unify -> KV)
      * /api/health (exposes build + flags)
  |\
  | \--> KV Namespaces (RATE_LIMIT, LEADERBOARD, ANALYTICS, SCANNER_META?)
  |       - Rate limit buckets
  |       - Leaderboard / analytics aggregates
  |       - Scanner metadata (optional)
  |
  +----> D1 Database (guestbook entries, waitlist_signups, consent_events)
  |
  +----> Turnstile Verification (Cloudflare API)
  |
  +----> HMAC Signing (session + role cookies)
```

## Mermaid Diagram

```mermaid
flowchart TD
  subgraph Client[Browser]
    A[Pages / Games UI]
    JS[Inline Script (nonce protected)\nwindow.ENV.flags]
  end

  A -->|Requests| MW[Astro Middleware\nSecurity Headers + CSP Nonce\nRequest ID]
  JS --> MW

  subgraph Worker[Astro SSR Worker]
    MW --> R1[/super-admin-elevate/]
    MW --> R2[/geo/]
    MW --> R3[/consent/]
    MW --> R4[/guestbook/]
    MW --> R5[/waitlist/]
    MW --> R6[/enhanced-security-scan/]
    MW --> R7[/health/]
  end

  R1 --> KV[(RATE_LIMIT KV)]
  R2 --> KV
  R3 --> KV
  R4 --> KV
  R5 --> KV
  R6 --> KV

  R3 --> D1[(D1: consent_events)]
  R4 --> D12[(D1: entries)]
  R5 --> D13[(D1: waitlist_signups)]

  R4 --> TURNSTILE[(Turnstile Verify API)]
  subgraph Cookies
    SC[Session Cookie escan_s]
    RC[Role Cookie escan_role]
  end
  MW --> SC
  R1 --> RC

  style MW fill:#222,stroke:#999,color:#fff
  style KV fill:#fffbdd,stroke:#b58900
  style D1 fill:#e0f7fa,stroke:#006064
  style TURNSTILE fill:#fce4ec,stroke:#ad1457
  style SC fill:#fafafa,stroke:#555
  style RC fill:#fafafa,stroke:#555
```

## Security Layers

1. HTTP Response Hardening: CSP (nonce for inline script), HSTS, Frame Deny, Referrer Policy, Permissions Policy, COOP/COEP/CORP, X-Content-Type-Options.
2. Cookie Integrity: HMAC-signed session and role cookies (HttpOnly, Secure, SameSite=Lax).
3. Rate Limiting: Central KV-backed limiter for elevation, geo, consent, guestbook, waitlist. Enhanced scan route currently uses in-memory; can migrate to KV for horizontal consistency.
4. Input Validation: URL length bounds, email regex, consent payload schema checks, game score gating, Turnstile captcha.
5. Privacy: IP hashing (geo utilities) with optional feature flags gating collection.
6. Feature Flags: Server-evaluated, safely projected subset to client via nonce-protected script.
7. Observability: Request ID header, server timing metric, structured console log (JSON).
8. Deployment Integrity: BUILD_ID constant (future: reject stale build via KV gate pre-response).

## Data Stores

- KV: Token buckets for rate limiting, analytics counters, leaderboard stats, optional scan metadata.
- D1: Relational tables (guestbook entries, consent events, waitlist signups) enabling auditability.
- Ephemeral Memory: Session cache layer inside ScanStore (non-authoritative; cookies are the durable carry).

## Request Flow (Example: Guestbook POST)

1. Browser submits entry with Turnstile token and player name.
2. Middleware assigns nonce + request ID; security headers prepared.
3. Guestbook POST handler rate limits by IP, validates captcha + minimum game score using ANALYTICS KV.
4. Inserts entry into D1, returns JSON with updated headers (CSP enforced). Cookies not modified unless session initialization occurred.

## Future Enhancements (Suggested)

- Replace inline style allowance by extracting critical styles or using hashed class safelist to drop 'unsafe-inline' in style-src.
- Central logging sink (e.g., Logpush or external) with sampling and PII scrubbing.
- Stale Deployment Guard: KV key storing ACTIVE_BUILD_ID; middleware compares against BUILD_ID and returns 404/redirect if mismatch.
- Structured error responses with correlation to request ID for all catch paths.
- Scheduled workflow to rotate signing keys (dual key grace period).

---

Generated: 2025-08-31
