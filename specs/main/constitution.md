# CONSTITUTION.md
> Personal Website — sarah.tn  
> Version 1.1 | Status: Draft

---

## 1. Project Identity

### 1.1 Purpose
This is a living personal website for a young adult woman. It serves as her permanent digital identity — a reference point for everyone who meets her: potential employers, academic institutions, collaborators, family, and friends. It is not a portfolio template. It is a curated world that lets visitors *discover* her on her own terms.

### 1.2 Core Promise
> "Every visitor leaves knowing something real about her."

The site must feel authored, not assembled. It should have a point of view. It should surprise without confusing. It should be warm without being naive.

### 1.3 Owner
A single person owns, edits, and grows this site. She is the sole content authority. All content management flows through her hands via the CMS. She requires no developer involvement to publish, update, or restructure content.

---

## 2. Design Philosophy

### 2.1 Dual-Layer Aesthetic
The site operates on two distinct visual registers:

**Layer 1 — The Shell (Global)**  
Clean, accessible, typographically strong. Navigation, landing, resume, reach-out, and reading sections live here. This layer must be immediately legible to any audience: a recruiter, a professor, a grandmother. It is calm, confident, and uncluttered.

**Layer 2 — The Experiences (Immersive Modules)**  
Specific sections deliberately break the grid and introduce a different interaction paradigm. These are *worlds within the site*, not pages. Life Map and Meet the Family are the founding examples. They have their own visual logic, motion language, and interaction model. Future sections may join this tier.

This split is intentional and must be preserved across all iterations. Adding immersive behavior to a shell section, or vice versa, requires an explicit design decision.

### 2.2 Design Tokens
A single global design token file governs all shell-layer styling (colors, typography, spacing, breakpoints, shadows, radius). Immersive modules may define local token overrides but must import and extend — never fork — the global tokens.

### 2.3 Accessibility
Shell-layer content must meet **WCAG 2.1 AA** at minimum. Immersive modules must meet AA for all informational content; interactive/decorative elements may relax to A with documented rationale.

### 2.4 Motion Principle
Motion is intentional and earned. The shell uses subtle, fast transitions (≤200ms). Immersive modules may use slower, choreographed animations. Motion must never block content access. All animated content must respect `prefers-reduced-motion`.

### 2.5 Mobile First
Every layout decision begins at 375px viewport width. Desktop is an enhancement. Touch interactions are primary; hover states are secondary.

---

## 3. Audience Tiers

The site recognizes three distinct audience tiers, each with a different access level and relationship to the owner:

| Tier | Name | Access | Identification |
|------|------|---------|----------------|
| T0 | **Public** | All public sections | Anonymous / fingerprinted |
| T1 | **Subscriber** | Public + interest-gated content | Email-verified subscription |
| T2 | **Owner** | Full site + admin PWA | Authenticated session |

Content is authored with an explicit audience tier. CMS schema enforces this. The frontend respects it at render time.

---

## 4. Content Architecture

### 4.1 Sections

| Section | Tier | Type | Description |
|---------|------|------|-------------|
| Home | T0 | Shell | Entry point, identity statement, animated introduction |
| Life Map | T0 | Immersive | Visual timeline of milestones, events, achievements |
| Meet the Family | T0 | Immersive | Family members presented in a playful, engaging format |
| My Projects | T0 | Shell | Current and past projects with status and detail |
| Readings | T0/T1 | Shell + Gated | Book/article list; curated notes may be T1-gated |
| Musings | T1 | Gated | Long or short-form writing, distributed by interest cluster |
| Resume | T0 | Shell | Downloadable + rendered CV |
| Reach Out | T0 | Shell | Contact form backed by .NET API |
| Links | T0 | Shell | GitHub, LinkedIn, and other external profiles |

### 4.2 Interest Clusters
Musings and optionally Readings are organized by **interest clusters** — named topic groups the owner defines (e.g. "Tech & Code", "Society & Culture", "Personal Growth"). Subscribers choose which clusters they follow. Content is tagged to one or more clusters.

### 4.3 Content Abstraction Layer (CAL)
All content is accessed by the frontend exclusively through the Content Abstraction Layer. No component imports from a CMS SDK directly. The CAL defines typed interfaces for every content entity. CMS adapters implement those interfaces. Switching CMS providers = swapping the adapter, not the site.

```
/src/content/
  interfaces/       ← typed contracts (e.g. IProject, IMilestone, IMusingPost)
  adapters/         ← one folder per CMS (e.g. /strapi, /sanity)
  index.ts          ← active adapter export (single line change to switch CMS)
```

---

## 5. Technical Principles

### 5.1 Frontend
- Built with **Astro** as the primary framework
- Islands architecture: interactive components hydrated on demand
- Component library: framework-agnostic where possible; React islands for complex interactivity
- All pages are statically generated at build time where content allows; SSR only where personalization or auth is required

### 5.2 CMS
- **Strapi** is the default initial choice (self-hosted on Azure, REST + GraphQL, open source)
- All content access goes through the CAL — the CMS is replaceable
- The owner manages all content via the Strapi admin UI
- Media assets are stored in Azure Blob Storage, referenced by the CMS

### 5.3 Backend (.NET C# API)
- ASP.NET Core 8 minimal API or controller-based (decided at spec phase)
- Deployed as an Azure App Service (Linux)
- Responsibilities: newsletter subscriptions, visitor fingerprinting, contact form processing, real-time features (SignalR), push notification dispatch, subscriber access token issuance
- Database: Azure SQL (Entity Framework Core)

### 5.4 Admin PWA
- A separate frontend application, not part of the public site build
- PWA: installable, push notification support, offline-capable for key admin views
- Real-time visitor dashboard via SignalR
- Hosted separately (Azure Static Web Apps or dedicated App Service slot)

### 5.5 Hosting (Azure)
| Component | Azure Service |
|-----------|--------------|
| Public site | Azure Static Web Apps |
| .NET API | Azure App Service (Linux) |
| Strapi CMS | Azure App Service (Linux) |
| Admin PWA | Azure Static Web Apps (separate) |
| Media assets | Azure Blob Storage + CDN |
| Database | Azure SQL Database |
| Real-time | Azure SignalR Service (or self-hosted hub) |
| Email | Azure Communication Services |

### 5.6 Developer Environment
All development happens on **Windows** using **VS Code**. This is a hard constraint that affects tooling selection at every layer:
- All CLI tools must run natively on Windows (PowerShell or Command Prompt). No WSL dependency, no Unix-only scripts.
- `.ps1` scripts are the standard for automation. Bash scripts are not used.
- Path separators, line endings (CRLF), and file system casing must be handled correctly by all tooling.
- VS Code is the canonical editor. Workspace settings, recommended extensions, and launch configurations are committed to the repository under `.vscode/`.
- Node.js, .NET SDK, and Azure CLI must all be installable via `winget` or documented Windows installers.
- Docker Desktop for Windows may be used for local Strapi + SQL Server development environments.

### 5.7 Infrastructure as Code
All Azure infrastructure is created and maintained by a single idempotent PowerShell script using **Azure CLI (`az` commands)**:

```
/infra/
  setup.ps1           ← main IaC script (idempotent, re-runnable)
  parameters.ps1      ← environment-specific values (not committed — gitignored)
  parameters.example.ps1  ← template with all required variables documented
  SETUP_GUIDE.md      ← step-by-step manual setup guide
```

**Script requirements:**
- Re-running `setup.ps1` must produce the same result as running it fresh. No duplicate resource errors.
- Each resource creation is guarded by an existence check (`az resource show` before `az resource create`).
- The script prints a clear, structured log of every action taken (created / already exists / updated / skipped).
- On completion, the script outputs a **manual steps checklist** — everything that cannot be automated (DNS records, GitHub secrets, app registrations, push VAPID key generation).
- Secrets are never written to files or echoed to the console. They are written directly to Azure Key Vault or printed once with a clear warning.
- The script is parameterized: `ResourceGroup`, `Location`, `SubscriptionId`, `AppName`, `Environment` (dev/staging/prod).

**`SETUP_GUIDE.md` requirements:**
- Covers every manual step in numbered, screenshot-ready format.
- Lists all required GitHub repository secrets with their source (where to find/generate each value).
- Documents DNS configuration steps per registrar type.
- Documents Azure AD app registration steps if auth is used.
- Includes a post-setup verification checklist.

### 5.8 Modularity & Maintainability
- Sections are autonomous modules: self-contained folder with component, styles, content interface, and tests
- No cross-section imports except through shared design system or CAL
- Feature flags control experimental sections without deployment gates
- A section can be removed by deleting its folder and one route entry

---

## 6. Cost Policy

Azure hosting cost must be actively managed. The target monthly budget for a production environment at steady state (pre-significant-traffic) is **≤ €30/month**. Cost decisions are architectural decisions.

### 6.1 Cost Tiers by Resource

| Resource | Target SKU | Rationale |
|----------|-----------|-----------|
| Public site (Azure Static Web Apps) | **Free tier** | Sufficient for static + API routes; upgrade only if limits are hit |
| Admin PWA (Azure Static Web Apps) | **Free tier** | Low traffic, owner-only |
| .NET API (App Service) | **B1** (Basic, 1 core, 1.75GB) | Lowest tier with custom domain + always-on; scale up only under load |
| Strapi CMS (App Service) | **B1** | Same rationale; can share App Service Plan with API if traffic is low |
| Azure SQL | **Basic (5 DTU)** | Sufficient for subscriber/visitor/contact data at personal site scale |
| Blob Storage | **LRS, Hot tier** | Media assets; cost is per-GB, negligible at launch |
| Azure CDN | **Microsoft CDN (Standard)** | Only enabled for Blob Storage media; static site uses SWA built-in CDN |
| Azure Communication Services | Pay-per-use | Email only; negligible at newsletter scale |
| SignalR | **Free tier (20 concurrent)** | Sufficient for owner admin use; upgrade if public real-time features are added |
| Azure Key Vault | **Standard** | Secret storage; cost is per-operation, negligible |

### 6.2 Cost Rules
- No resource is provisioned at a Premium or higher SKU without a documented reason and traffic evidence.
- App Service Plans are shared between API and CMS until load requires separation.
- Azure Monitor / Application Insights is used in **sampling mode** — not full telemetry — to control ingestion costs.
- CDN is not added to the public static site (Azure Static Web Apps has a built-in global CDN). CDN is only used for media blob delivery.
- Reserved instances (1-year) are evaluated after 3 months of stable usage.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Lighthouse Performance | ≥ 90 (mobile) |
| Lighthouse Accessibility | ≥ 95 |
| First Contentful Paint | ≤ 1.5s (static pages) |
| Largest Contentful Paint | ≤ 2.5s |
| Cumulative Layout Shift | ≤ 0.1 |
| Total Blocking Time | ≤ 200ms |
| Core Web Vitals | All green |
| Mobile viewport support | 375px – 428px primary |
| Browser support | Last 2 versions of Chrome, Firefox, Safari, Edge |
| Uptime SLA | 99.5% (Azure Static Web Apps baseline) |
| Image format | WebP with AVIF fallback; no unoptimized PNG/JPEG in production |
| JS bundle (shell pages) | ≤ 50KB gzipped per route (Astro zero-JS default) |
| API response time (p95) | ≤ 300ms for all non-real-time endpoints |

### 7.1 Performance Principles
- Astro's default zero-JavaScript output is the baseline. Every hydrated island must justify its JS cost.
- Images are always served with explicit `width` and `height` to prevent layout shift.
- Fonts are self-hosted (downloaded from Google Fonts, committed to repo) to eliminate third-party DNS lookup latency.
- No render-blocking third-party scripts. Analytics and fingerprinting load as `async` or `defer`.
- The Blob Storage CDN serves all media. Images are never served from the API or CMS directly in production.

---

## 8. Governance

### 8.1 Versioning
This constitution is versioned. Breaking changes to architecture, design philosophy, cost policy, or audience tier model require a version bump and a migration note.

### 8.2 Section Lifecycle
Sections go through: `concept → spec → build → review → live → maintained → deprecated`. No section goes live without a completed spec.

### 8.3 Incremental Build Verification
Every development phase ends with a **build gate** before the next phase begins:
- `astro build` must complete with zero errors and zero warnings
- `dotnet build` must complete with zero errors
- Lighthouse CI must pass all configured thresholds on at least one representative page
- All implemented API endpoints must be smoke-tested (manual or automated)
- A **phase review checkpoint** is held: the full picture is reviewed against the constitution before proceeding

No phase is considered complete until its build gate passes. Partial completion is documented and tracked, never silently carried forward.

### 8.4 CMS Migration Policy
A CMS migration is a planned event, not an emergency fix. It requires: CAL interface review, adapter implementation, content export/import validation, and a staging deployment. The public site must not go dark during migration.

### 8.5 Owner Autonomy
Any content change the owner wishes to make must be achievable without developer involvement. If it requires code, it is a developer task and must be logged as such.

### 8.6 Infrastructure Change Policy
Changes to Azure resources must be reflected in `setup.ps1` before being applied to production. Manual changes to production Azure resources that are not captured in the script are considered drift and must be reconciled within the same sprint.

---

## 9. Out of Scope (v1)
- Multi-language / i18n
- E-commerce or paid content
- Third-party comments (e.g. Disqus)
- User-generated content beyond contact form
- Native mobile app (iOS/Android)
- Full offline public site (PWA is owner-only)
