<!--
SYNC IMPACT REPORT
==================
Version change: (blank template) → 1.0.0
Bump type: MAJOR — first population of the constitution from template; all principles and
sections are new.

Modified principles:
  (none — initial authoring)

Added sections:
  - Core Principles (I–VI)
  - Technical Stack & Platform Constraints
  - Section Lifecycle & Out-of-Scope Boundaries
  - Governance

Removed sections:
  (none)

Templates reviewed:
  ✅ .specify/templates/plan-template.md     — Constitution Check gate is present; gates below align
  ✅ .specify/templates/spec-template.md     — FR/SC structure compatible; no constitution refs needed
  ✅ .specify/templates/tasks-template.md    — Phase structure and build-gate checkpoint align with
                                               Principle V; no changes required
  ✅ .specify/templates/checklist-template.md — Generic; no constitution refs; no changes required
  ✅ specs/main/constitution.md              — Source of truth used to derive all values here

Follow-up TODOs:
  (none — all fields resolved from specs/main/constitution.md)
-->

# Konnichiwa Site Constitution

## Core Principles

### I. Dual-Layer Architecture

The site operates on exactly two visual and interaction registers:

- **Shell layer** (Home, Resume, Projects, Readings, Reach Out, Links): MUST be clean,
  typographically strong, and immediately legible to any audience. Calm, confident, uncluttered.
- **Immersive modules** (Life Map, Meet the Family, and future candidates): MUST define their
  own visual logic, motion language, and interaction model. They are *worlds within the site*,
  not pages.

Rules:
- Shell sections MUST NOT adopt immersive behaviors without an explicit, documented design
  decision.
- Immersive modules MUST NOT be styled by shell-layer conventions.
- Immersive modules MUST import and extend the global design token file — never fork it.
- New sections MUST declare their layer assignment before spec work begins.

**Rationale**: Without enforced layer separation, visual coherence and maintainability collapse
as the site grows. This split is the defining architectural identity of the project.

### II. Content Abstraction Layer (CMS Agnostic)

All frontend content access MUST go through the Content Abstraction Layer (CAL) located at
`/src/content/`. No component or page MUST import from a CMS SDK directly.

Rules:
- CAL defines typed interfaces for every content entity (`IProject`, `IMilestone`,
  `IMusingPost`, etc.).
- CMS adapters implement those interfaces; one folder per CMS under `/src/content/adapters/`.
- Switching CMS providers MUST require only swapping the active adapter in
  `/src/content/index.ts` — no site-wide changes.
- Media assets are served from Azure Blob Storage + CDN; images MUST NOT be served from the
  API or CMS directly in production.

**Rationale**: The CMS is an implementation detail, not a dependency. Vendor lock-in at the
content layer would make migration prohibitively expensive.

### III. Owner Autonomy

The site owner MUST be able to create, update, and restructure all content without developer
involvement.

Rules:
- Any content change that requires writing or modifying code is classified as a **developer
  task** and MUST be logged as such.
- The CMS admin UI (Strapi) is the sole content management interface for the owner.
- Content schema changes that break owner workflows are treated as regressions.
- Subscriber-gated content (T1), public content (T0), and owner-only views (T2) MUST be
  enforceable via CMS configuration, not deployment.

**Rationale**: The owner is the sole content authority. Developer bottlenecks in content
workflows undermine the site's core promise.

### IV. Mobile-First & Performance

Every layout decision begins at a 375px viewport. Desktop is an enhancement.

Non-negotiable targets:
- Lighthouse Performance ≥ 90 (mobile)
- Lighthouse Accessibility ≥ 95
- First Contentful Paint ≤ 1.5 s (static pages)
- Largest Contentful Paint ≤ 2.5 s
- Cumulative Layout Shift ≤ 0.1
- JS bundle per shell route ≤ 50 KB gzipped (Astro zero-JS baseline)
- API response time (p95) ≤ 300 ms for all non-real-time endpoints

Rules:
- Astro's zero-JavaScript output is the default. Every hydrated island MUST justify its JS
  cost explicitly in its spec.
- All motion MUST respect `prefers-reduced-motion`.
- Shell layer MUST meet WCAG 2.1 AA. Immersive modules MUST meet AA for informational
  content; interactive/decorative elements may relax to A with documented rationale.
- Images MUST be served in WebP (AVIF fallback), with explicit `width` and `height` set.
- Fonts MUST be self-hosted; no third-party DNS lookups at render time.
- No render-blocking third-party scripts; analytics and fingerprinting MUST load `async` or
  `defer`.

**Rationale**: The majority of personal site visitors arrive on mobile. Performance is
respect for the visitor's time.

### V. Incremental Build Verification

Every development phase MUST end with a build gate before the next phase begins. No phase is
complete until its gate passes. Partial completion is documented and tracked, never silently
carried forward.

Build gate requirements:
- `astro build` completes with **zero errors and zero warnings**.
- `dotnet build` completes with **zero errors**.
- Lighthouse CI passes all configured thresholds on at least one representative page.
- All implemented API endpoints are smoke-tested (manual or automated).
- A phase review checkpoint is held: the full picture is reviewed against this constitution
  before proceeding.

Section lifecycle: `concept → spec → build → review → live → maintained → deprecated`.
No section goes live without a completed spec.

**Rationale**: Accumulated technical debt and constitution drift are the primary risk to
long-term maintainability of a solo-maintained site.

### VI. Azure Cost Governance

Azure hosting cost MUST remain ≤ €30/month at steady state (pre-significant-traffic).
Cost decisions are architectural decisions.

Rules:
- No resource is provisioned at a Premium or higher SKU without a documented reason and
  traffic evidence.
- App Service Plans MUST be shared between API and CMS until load requires separation.
- Azure Monitor / Application Insights MUST operate in sampling mode.
- CDN MUST NOT be added to the public static site (Azure Static Web Apps has a built-in
  global CDN); CDN is used only for Azure Blob Storage media delivery.
- Reserved instances (1-year) are evaluated after 3 months of stable usage.
- All Azure resource changes MUST be reflected in `infra/setup.ps1` before being applied to
  production. Manual production changes that are not captured in the script are classified as
  **infrastructure drift** and MUST be reconciled within the same sprint.

**Rationale**: This is a personal site with one owner and a fixed budget. Uncontrolled cloud
spend would directly threaten the site's existence.

## Technical Stack & Platform Constraints

**Canonical technology choices** (changes require a constitution amendment):

| Layer | Technology |
|-------|-----------|
| Frontend framework | Astro (islands architecture) |
| Interactive islands | React (complex interactivity only) |
| CMS | Strapi (self-hosted, REST + GraphQL) |
| Backend API | ASP.NET Core 8 (.NET C#) |
| Database | Azure SQL (Entity Framework Core) |
| Hosting | Azure Static Web Apps (public site + Admin PWA) |
| API hosting | Azure App Service — Linux, B1 SKU |
| Media | Azure Blob Storage + Microsoft CDN |
| Real-time | Azure SignalR Service (Free tier) |
| Email | Azure Communication Services |
| IaC | PowerShell (`az` CLI) — `infra/setup.ps1` |

**Developer environment constraints** (Windows, VS Code — HARD):
- All CLI tools MUST run natively on Windows (PowerShell or CMD). No WSL dependency.
- `.ps1` scripts are the standard for all automation. Bash scripts are not used.
- Path separators, line endings (CRLF), and file system casing MUST be handled correctly by
  all tooling.
- VS Code workspace settings, recommended extensions, and launch configs MUST be committed
  under `.vscode/`.

**Infrastructure as Code rules:**
- `infra/setup.ps1` MUST be idempotent (re-running produces the same result).
- Each resource creation MUST be guarded by an existence check before creation.
- Secrets MUST NOT be written to files or echoed to the console; they go to Azure Key Vault
  or are printed once with a clear warning.

## Section Lifecycle & Out-of-Scope Boundaries

**Section autonomy rule**: Each section is an autonomous module — self-contained folder with
component, styles, content interface, and tests. No cross-section imports except through the
shared design system or CAL. A section MUST be removable by deleting its folder and one
route entry.

**Feature flags**: Control experimental sections without deployment gates.

**Audience tiers** (enforced at render time and CMS schema level):

| Tier | Name | Access |
|------|------|--------|
| T0 | Public | All public sections |
| T1 | Subscriber | Public + interest-gated content (email-verified) |
| T2 | Owner | Full site + Admin PWA (authenticated session) |

**Out of scope for v1** (require explicit constitution amendment to add):
- Multi-language / i18n
- E-commerce or paid content
- Third-party comments (e.g. Disqus)
- User-generated content beyond the contact form
- Native mobile app (iOS/Android)
- Full offline public site (PWA is owner-only)

## Governance

This constitution supersedes all other practices, conventions, and tool defaults. When
conflict arises, the constitution wins.

**Amendment procedure:**
1. Identify the principle or section to change and classify the bump type (MAJOR/MINOR/PATCH).
2. Draft the amendment and obtain owner approval before merging.
3. Run `/speckit-constitution` to propagate changes and produce a Sync Impact Report.
4. Update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION`.
5. Commit with message: `docs: amend constitution to vX.Y.Z (<description>)`.

**Versioning policy:**
- MAJOR: Backward-incompatible changes — principle removals, redefinitions, or technology
  replacements.
- MINOR: New principle or section added, or materially expanded guidance.
- PATCH: Clarifications, wording fixes, typo corrections, non-semantic refinements.

**Compliance review:** All plan reviews (Constitution Check gate in `plan-template.md`) MUST
verify compliance with the six Core Principles before Phase 0 research and again after Phase
1 design. Complexity violations MUST be documented in the Complexity Tracking table.

**Runtime guidance:** The active spec for any feature lives under `specs/[###-feature-name]/`.
The agent guidance file is `.specify/integrations/claude/` (Claude integration).

**Version**: 1.0.0 | **Ratified**: 2026-04-04 | **Last Amended**: 2026-04-04
