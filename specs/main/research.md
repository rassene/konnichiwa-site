# Research: Konnichiwa — Personal Website

**Branch**: `main` | **Date**: 2026-04-04 | **Plan**: [plan.md](plan.md)

All decisions are derived from `specs/main/spec.md`, `specs/main/constitution.md`, and
architectural analysis. No external research required — technology choices are fixed by
the spec. This document records the decisions, rationale, and alternatives considered
for each non-obvious choice.

---

## Decision 1: Strapi Database — SQLite for Production

**Decision**: Strapi v4 uses SQLite in both local development and production
(Azure App Service Linux, file stored at `/home/strapi/data.db`).

**Rationale**:
- Strapi v4 natively supports SQLite. For a single-editor personal site with low write
  frequency, SQLite is reliable and operationally simple.
- Avoids provisioning a managed Postgres or MySQL instance on Azure, saving ~€12–15/month
  (which would consume 40–50% of the €30 budget).
- Azure App Service Linux provides persistent storage for `/home` by default — the SQLite
  file survives restarts and deployments.
- Backup strategy: daily Azure App Service backup includes the `/home` directory.

**Alternatives considered**:
- Azure Database for PostgreSQL Flexible Server (Burstable B1ms): ~€12/month — too
  expensive given the budget constraint. Rejected.
- Azure Database for MySQL Flexible Server: Similar cost. Rejected.
- Azure SQL (shared with .NET API): Strapi v4 does not support SQL Server natively.
  Rejected.
- PlanetScale / Supabase (managed free tier): Third-party dependency, vendor risk,
  adds external auth to manage. Rejected for simplicity.

**Mitigation**: If traffic grows significantly and write concurrency becomes an issue,
migrating Strapi to PostgreSQL requires only a data export/import and a Strapi config
change — the CAL adapter is unaffected.

---

## Decision 2: Admin PWA Authentication — Credential-Based JWT

**Decision**: The Admin PWA uses simple credential-based authentication (owner email +
password) with JWT access token (15-min expiry) + HttpOnly refresh token cookie
(30-day expiry). No Azure AD B2C.

**Rationale**:
- There is exactly one user (the owner). Azure AD B2C is designed for multi-user
  scenarios and adds significant setup complexity, an additional Azure resource, and
  potential cost at higher authentication volumes.
- A hardened single-user credential system with refresh token rotation satisfies all
  security requirements for a personal admin panel.
- The .NET API already issues JWTs for subscriber access — the same infrastructure can
  serve admin auth with a different claims scope (`role: owner`).
- B2C can be added later if the site ever adds more admin users.

**Alternatives considered**:
- Azure AD B2C: Recommended in spec for "future extensibility" but overkill for one
  user at launch. Deferred to v2.
- Passkey / WebAuthn: Excellent for single-user UX but adds implementation complexity.
  Deferred to v2.
- GitHub OAuth (since owner is a developer): Creates dependency on GitHub account state.
  Rejected.

---

## Decision 3: SignalR — Self-Hosted Hub vs Azure SignalR Service

**Decision**: Use Azure SignalR Service Free tier (20 concurrent connections) initially.
Fall back to self-hosted hub inside the .NET API if the free tier limits are hit.

**Rationale**:
- The Admin PWA real-time dashboard requires one persistent SignalR connection (owner).
- Public site heartbeats are fire-and-forget HTTP (or WebSocket) with low persistence
  requirements.
- Azure SignalR Service Free tier supports 20 concurrent connections and 20,000
  messages/day — sufficient for a personal site at launch.
- Zero-cost at launch; upgrade path is well-defined.

**Alternatives considered**:
- Self-hosted SignalR hub: Always-on in the .NET API process. Viable but requires
  sticky session configuration on App Service (ARR Affinity). Kept as fallback.

---

## Decision 4: Fingerprinting — FingerprintJS OSS (No Pro)

**Decision**: Use `@fingerprintjs/fingerprintjs` (open-source, v4) client-side.
Do NOT use FingerprintJS Pro.

**Rationale**:
- The Pro version adds a server-side identification service with monthly cost.
- The OSS version runs entirely client-side, producing a device fingerprint hash
  sufficient for "recognize returning visitor" personalization at a personal site scale.
- Accuracy is lower than Pro (~60–90% stability across sessions vs ~99.5% Pro), but
  this is acceptable for a personalization feature (not authentication or fraud
  detection).
- GDPR compliance is simpler with OSS: no data leaves the user's browser to a third
  party; only the hash is sent to our own API.

---

## Decision 5: Newsletter Dispatch — Hangfire with Azure SQL Persistence

**Decision**: Use Hangfire (background jobs) persisted to the same Azure SQL database
as the rest of the .NET domain data. Hangfire runs in-process with the .NET API.

**Rationale**:
- Hangfire is the standard .NET background job library, production-proven, and has
  first-class SQL Server persistence support.
- In-process hosting means no additional Azure resource (Azure Functions, Azure Queue)
  is needed, keeping costs down.
- Newsletter dispatch volumes for a personal site (hundreds to low-thousands of
  subscribers) are well within in-process job limits.
- Hangfire dashboard (protected by admin auth) provides visibility into job execution.

**Alternatives considered**:
- Azure Functions with Timer Trigger: Additional Azure resource, more complex local
  dev setup. Rejected for simplicity.
- Azure Service Bus + Worker Service: Significantly more infrastructure for the scale.
  Rejected.

---

## Decision 6: Image Format Pipeline — Build-Time Optimization

**Decision**: Images in the Strapi CMS are uploaded by the owner and automatically
resized/converted to WebP by Strapi's media provider (Azure Blob Storage via
`@strapi/provider-upload-azure-storage`). Astro's built-in `<Image>` component handles
WebP/AVIF conversion for static assets committed to the repo.

**Rationale**:
- Spec mandates WebP with AVIF fallback and no unoptimized PNG/JPEG in production.
- Strapi's upload provider handles server-side media; Astro handles build-time static
  assets. This covers 100% of image origins.
- No additional image CDN or processing service needed — Azure Blob + Microsoft CDN
  serves optimized images.

---

## Decision 7: Musings Access Token Storage — localStorage

**Decision**: Subscriber JWT access token stored in `localStorage` under key
`sub_token`, as specified in the spec (§4.2).

**Rationale**:
- Simplest client-side token storage for a stateless subscriber verification flow.
- The subscriber token grants access to read-only content — not to any write operations
  or sensitive personal data. The XSS risk is proportionate to the stake (content
  visibility, not financial or PII access).
- HttpOnly cookies require server-side session management complexity for a purely
  client-side content-gating use case.

**Note**: Admin PWA tokens use HttpOnly cookies (higher privilege, higher protection).

---

## Decision 8: Accent Color — Terracotta Placeholder

**Decision**: The accent color `#D4522A` in the design tokens is a **confirmed
placeholder**. Final palette must be approved by the owner before development of any
colored UI elements begins. All color-dependent components use the CSS custom property
`--color-accent` so a single token change propagates everywhere.

**Action required**: Owner to confirm final accent color before Phase 3 begins.

---

## Resolved Open Questions

| Section | Question | Resolution |
|---------|----------|------------|
| §3.1 Home | Full name or first name in hero? | Deferred to owner — use placeholder in development |
| §3.1 Home | Tagline content? | Deferred to owner — use placeholder in development |
| §3.2 Life Map | Future milestones (aspirations) allowed? | Yes — use `category: 'future'` extension in IMilestone |
| §3.2 Life Map | Video support in milestone media? | V2 — not in initial implementation |
| §3.2 Life Map | Dark background confirmed? | Yes — spec states "dark or deeply saturated background" |
| §3.3 Family | How many family members? | Spec says layout adapts — implement for 4–10 members |
| §3.3 Family | Real photos or illustrated avatars? | Owner to decide — component supports both via IMedia |
| §3.3 Family | Pets included? | Owner to decide — content-only decision, no code impact |
| §3.4 Projects | Project-specific URL or modal only? | Both — modal by default, URL route (`/projects/[slug]`) for featured |
| §3.4 Projects | GitHub integration? | V2 — not in initial implementation |
| §3.5 Musings | Write directly in CMS or dedicated UI? | Strapi admin is the writing interface (owner preference) |
| §3.5 Musings | RSS feed? | V2 — not in initial implementation |
| §3.8 Reach Out | Public acknowledgment email to visitor? | No auto-reply in v1 — confirmation shown in-page only |
| §4.4 Admin Auth | Azure AD B2C vs credential-based? | Credential-based JWT (see Decision 2 above) |
