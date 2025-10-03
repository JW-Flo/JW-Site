# AtlasIT Platform Inventory - Migration to SvelteKit Edge

This inventory catalogs all existing functionality across the monorepo, assessing migration priority and edge compatibility for the SvelteKit consolidation.

## Source Apps Overview

### apps/platform (Astro) - Primary IT Dashboard

**Purpose**: Main application with dashboard, onboarding, marketplace, and admin features  
**Edge Compatibility**: Mostly compatible, some APIs may need Node API removal  
**Migration Priority**: **CRITICAL** - Core business functionality

### (Removed) apps/jw-immersive (Astro) - Marketing & Blog

Historical only. The Astro marketing/blog application was fully removed in favor of a unified console worker + redirect at domain root. Content and demo surfaces can be reintroduced as SvelteKit/Worker routes if needed. Previous purpose: public marketing site, blog, demos, contact. (Decommission complete.)

### apps/marketing (Astro) - Product Pages

**Purpose**: Dedicated marketing pages for specific products  
**Edge Compatibility**: High - static content  
**Migration Priority**: **MEDIUM** - Can coexist initially

### apps/awhittlewandering (Workers/Hono) - APIs & Data

**Purpose**: Backend APIs, data processing, integrations  
**Edge Compatibility**: Already edge-native  
**Migration Priority**: **HIGH** - API consolidation needed

### workers/api-gateway - Authentication

**Purpose**: JWT auth endpoints, user management  
**Edge Compatibility**: Already edge-native  
**Migration Priority**: **CRITICAL** - Auth foundation

## Detailed Functionality Inventory

### Pages/Routes (*.astro,*.tsx)

#### apps/platform/src/pages/

- `index.astro` - Landing page with navigation
- `dashboard.astro` - **CRITICAL** - Main IT dashboard with metrics, IAM automation, workflows
  - Heavy client-side JS for demo data hydration
  - Fetches from `/api/demo/data`, `/api/iam-automation`
  - Complex UI with glass effects, mobile menu, activity feeds
- `onboarding.astro` - **CRITICAL** - Company onboarding form
  - POST to `/api/onboarding`
- `marketplace/` - **HIGH** - Integration marketplace
  - `index.astro` - Marketplace listing
  - `google.astro` - Google Workspace integration page
  - `microsoft365.astro` - Microsoft 365 integration page
  - Client-side OAuth flow initiation
- `orchestrator/` - **MEDIUM** - Workflow orchestration UI
  - `index.astro` - Main orchestrator page
- `api-manager.astro` - **MEDIUM** - API management interface
- `jml-demo.astro`, `jml-demo-new.astro` - **HIGH** - JML lifecycle demo
- `login.astro`, `register.astro` - **CRITICAL** - Auth pages
- `contact.astro` - **LOW** - Contact form
- `enhanced-security-scanner.astro` - **MEDIUM** - Security scanner UI
- `games.astro` - **LOW** - Demo games page
- `workflows.astro` - **MEDIUM** - Workflow management
- `it/policies.astro` - **HIGH** - IT policy management
- `security.astro` - **MEDIUM** - Security center
- `governance/compliance.astro` - **MEDIUM** - Compliance dashboard

#### (Removed) apps/jw-immersive/src/pages/ (historical reference)

- `index.astro` - **HIGH** - Homepage
- `about.astro` - **MEDIUM** - About page
- `projects.astro` - **MEDIUM** - Projects showcase
- `contact.astro` - **MEDIUM** - Contact form
- `blog/` - **MEDIUM** - Blog functionality
  - `index.astro` - Blog listing
  - `[...slug].astro` - Individual posts
- `demo.astro`, `demos/` - **HIGH** - Demo pages
- `enhanced-security-scanner.astro` - **MEDIUM** - Security scanner
- `guestbook.astro` - **LOW** - Guestbook
- `legal.astro` - **LOW** - Legal pages
- `team/` - **MEDIUM** - Team pages
- `verification.astro` - **LOW** - Verification page
- `workflows.astro` - **MEDIUM** - Workflow showcase
- `api/` - Various API endpoints (see below)

#### apps/marketing/src/pages/

- `index.astro` - **MEDIUM** - Marketing landing page

### API Endpoints

#### apps/platform/src/pages/api/

- `onboarding.ts` - **CRITICAL** - POST /api/onboarding
  - Zod validation, analytics logging
  - Edge-compatible (uses crypto.randomUUID)
- `oauth/` - **CRITICAL** - OAuth endpoints
  - `google.ts` - Google Workspace OAuth start
  - `entra.ts` - Entra OAuth start
  - `microsoft365.ts` - Microsoft 365 OAuth start
- `analytics.ts` - **MEDIUM** - Analytics endpoint
- `demo/` - **HIGH** - Demo data endpoints
  - Various demo data simulation
- `paycom/` - **MEDIUM** - Paycom integration
- `screenshot-event.get.ts`, `screenshot-event.ts` - **LOW** - Screenshot detection

#### (Removed) apps/jw-immersive/src/pages/api/ (historical reference)

- `guestbook.ts`, `guestbook/` - **LOW** - Guestbook API
- `analytics/` - **MEDIUM** - Analytics endpoints
- `consent.ts` - **MEDIUM** - Consent management
- `enhanced-security-scan.ts` - **MEDIUM** - Security scanning
- `geo.ts` - **LOW** - Geolocation
- `health.ts` - **HIGH** - Health check
- `ip-info.ts` - **LOW** - IP information
- `onboarding/` - **MEDIUM** - Onboarding flows
- `r2/` - **HIGH** - R2 storage operations
- `scanner-health.ts` - **MEDIUM** - Scanner health
- `security-scan.ts` - **MEDIUM** - Security scanning
- `super-admin-elevate.ts` - **LOW** - Admin elevation
- `test-client-address.ts` - **LOW** - Testing
- `waitlist.ts` - **MEDIUM** - Waitlist management
- `workflows/` - **MEDIUM** - Workflow APIs

#### workers/api-gateway/src/index.ts

- **CRITICAL** - Auth API
  - POST /api/v1/auth/login - JWT login
  - POST /api/v1/auth/refresh - Token refresh
  - POST /api/v1/auth/logout - Logout
  - Simplified JWT implementation (needs crypto.subtle upgrade)

#### apps/awhittlewandering/src/Function/index.js

- **HIGH** - Worker function (needs investigation)

### Components

#### packages/ui/src/

- `Button.tsx` - **HIGH** - Basic button component
  - React component, needs Svelte conversion

#### apps/platform/src/components/

- `JmlDemo.vue` - **HIGH** - Vue component for JML demo
  - Needs conversion to Svelte

### Business Logic

#### packages/core/src/

- `schemas.ts` - **CRITICAL** - Zod schemas for:
  - Auth (login, refresh, MFA, consent)
  - Tenancy (tenant creation, members)
  - Policies (creation, execution, jobs)
  - Security (MFA, consent)
  - Audit (queries, events)
- `connectors/` - **HIGH** - Integration connectors

### Assets & Configuration

#### Static Assets

- Various images, stylesheets across apps
- Tailwind configs
- Astro configs (some may have Node-specific settings)

#### Environment Variables

- OAuth secrets (Google, Entra)
- Database connections
- API keys for integrations
- SITE_URL configurations

## Migration Priority Matrix

### CRITICAL (Must migrate first)

- Dashboard page and metrics
- Onboarding API and flow
- OAuth start endpoints
- Auth system (JWT from workers)
- Core schemas from packages/core

### HIGH (Core functionality)

- Marketplace pages
- JML demo
- Homepage and key marketing pages
- Health checks and basic APIs
- UI component conversion

### MEDIUM (Enhanced features)

- Blog system
- Additional admin panels
- Security scanner
- Workflow orchestration UI
- Analytics endpoints

### LOW (Nice-to-have)

- Demo games
- Guestbook
- Legal pages
- Testing utilities

## Edge Compatibility Assessment

### Already Edge-Compatible

- All Worker endpoints (workers/api-gateway, awhittlewandering)
- Most Astro API routes (if not using Node APIs)
- Static content and client-side JS

### Needs Edge Migration

- Any code using:
  - `require()` instead of `import`
  - Node.js built-ins (fs, path, etc.)
  - Node-specific APIs in Astro
- Vue components (JmlDemo.vue) - needs Svelte conversion
- React components (packages/ui) - needs Svelte conversion

### Potential Blockers

- Heavy client-side JavaScript in dashboard (may need server-side rendering)
- Vue component integration
- Complex state management in client-side code

## Dependencies & Connections

### Data Flow

- Dashboard → /api/demo/data → Demo simulation
- OAuth flow: Marketplace → /api/oauth/* → External providers
- Onboarding → /api/onboarding → Analytics logging
- Auth: Login forms → workers/api-gateway → JWT tokens

### Shared Dependencies

- Zod schemas (packages/core)
- UI components (packages/ui)
- Analytics utilities
- Demo data simulation

### External Integrations

- Google Workspace OAuth
- Microsoft 365/Entra OAuth
- Okta (referenced in schemas)
- AWS (referenced in schemas)
- Paycom (HRIS integration)

## Migration Strategy Recommendations

1. **Start with infrastructure**: Migrate auth system and core schemas
2. **Core pages first**: Dashboard, onboarding, marketplace
3. **APIs second**: Convert Astro API routes to SvelteKit +server.ts
4. **Marketing last**: Public pages can coexist during transition
5. **Test continuously**: Each migration should maintain functionality

## Success Criteria

- All critical pages load and function
- OAuth flows work end-to-end
- APIs return correct responses
- No Node API usage in production builds
- Tests pass for migrated functionality

## Migration Progress

### ✅ Step 1: Create INVENTORY.md - COMPLETED

- Scanned all source apps and packages
- Documented functionality by location and priority
- Assessed edge compatibility
- Created comprehensive migration roadmap

### ✅ Step 2: Migrate Auth Infrastructure - COMPLETED

**Source**: `workers/api-gateway/src/index.ts`  
**Target**: `apps/atlasit-sveltekit/src/routes/api/auth/`

**Migrated Components**:

- ✅ JWT utilities with crypto.subtle (edge-safe)
- ✅ Login endpoint: `POST /api/auth/login`
- ✅ Refresh endpoint: `POST /api/auth/refresh`
- ✅ Logout endpoint: `POST /api/auth/logout`
- ✅ Auth middleware in hooks.server.ts
- ✅ Client-side auth utilities (AuthClient class)
- ✅ TypeScript types and schemas
- ✅ Updated app.d.ts with JWT_SECRET and user locals

**Key Improvements**:

- Proper crypto.subtle JWT signing/verification (vs simulated signatures)
- SvelteKit +server.ts handlers (vs Hono workers)
- Integrated with existing security headers
- Client-side session management
- Type-safe auth state

**Testing**: All tests pass, build succeeds, edge-compatible

### 🔄 Step 3: Migrate Core Pages - IN PROGRESS

**Priority**: Dashboard, Onboarding, Marketplace  
**Next**: Convert dashboard.astro to SvelteKit page
