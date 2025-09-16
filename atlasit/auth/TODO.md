# AtlasIT Auth & Onboarding TODOs

## ✅ Completed Foundation
- [x] Replace ad-hoc loggers across onboarding with the shared logger to keep structured telemetry.
- [x] Centralize AtlasIT error handling so onboarding reuses the shared `AtlasITError` class.
- [x] Introduce a reusable API key authentication helper that avoids repeating parsing/validation logic.
- [x] Harden API key comparison logic with timing-safe checks and proper redaction in logs.
- [x] Improve request context propagation (request ID, actor) to remove the `unknown` fallbacks in middleware.
- [x] Evaluate moving AI helper wiring into a shared module so generators do not instantiate mock services.

## 🧪 Task 1 – Test Coverage
- [ ] Add Vitest coverage for `ApiKeyAuthenticator` including valid, missing, invalid, hashed, and malformed config cases.
- [ ] Add Vitest coverage for onboarding `rateLimit` middleware covering KV miss, exceeded limits, malformed state, and missing binding scenarios.
- [ ] Add Vitest coverage for onboarding `auth` middleware covering skipped auth, valid keys, missing keys, and invalid keys with header assertions.

## 🔐 Task 2 – Secret Management Guidance
- [ ] Draft `SECRETS.md` describing AtlasIT secret management best practices, comparing KV vs. Secrets Manager.
- [ ] Document migration steps for moving existing plain-text env secrets into managed storage.

## 🧾 Task 3 – Strict Mode Migration Plan
- [ ] Analyse current typing gaps in `@atlasit/auth` and `@atlasit/onboarding` and summarize findings.
- [ ] Produce phased plan to enable `strict` in both packages with identified blockers.
- [ ] List per-file follow-ups in this TODO and mark items requiring code changes.

## 🛠 Task 4 – General Improvements
- [ ] Refactor any remaining bespoke loggers/error classes/request IDs across AtlasIT services to shared utilities.
- [ ] Audit onboarding/auth routes for consistent structured error responses and security headers.
- [ ] Confirm handlers set appropriate security headers such as `WWW-Authenticate` where applicable.
