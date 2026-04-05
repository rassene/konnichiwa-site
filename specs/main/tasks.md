---
description: "Task list for Konnichiwa — full personal website implementation"
---

# Tasks: Konnichiwa — Personal Website

**Input**: Design documents from `/specs/main/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Not requested — no test tasks generated. Add `/speckit-tasks --tdd` to generate
TDD tasks per user story if desired. Build gate validations (Lighthouse CI, `dotnet test`,
`astro build`) are checkpoints, not tasks.

**Organization**: Tasks are grouped into four delivery phases matching the plan's phased
delivery model. Each phase is independently deployable and ends with a build gate.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US#]**: Which delivery phase this task belongs to
- Exact file paths are included in all implementation tasks

## Path Conventions

- Public site: `src/site/src/`
- Admin PWA: `src/admin/src/`
- .NET API: `src/api/PersonalSite.<Layer>/`
- Strapi CMS: `cms/`
- Infrastructure: `infra/`
- CI/CD: `.github/workflows/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository scaffold, tooling, Docker, VS Code workspace, and GitHub CI skeletons.
No Azure provisioning yet — local dev only.

- [x] T001 Initialize Git repository with `.gitignore` (Node, .NET, Strapi, secrets) and
  `README.md` at repo root
- [x] T002 [P] Create VS Code workspace file `.vscode/extensions.json` with all recommended
  extensions per spec §6.3
- [x] T003 [P] Create `.vscode/settings.json` with CRLF, formatOnSave, defaultFormatter,
  dotnet.defaultSolution, typescript.tsdk per spec §6.3
- [x] T004 [P] Create `.vscode/launch.json` with debug configs for .NET API
  (`PersonalSite.Api`) and Astro dev server
- [x] T005 [P] Scaffold Astro 4 project at `src/site/` — created manually; package.json,
  astro.config.mjs, tsconfig.json, placeholder index.astro created. Node 24.14.1 now
  installed — `npm install` can be run in `src/site/` without issues
- [x] T006 [P] Scaffold React SPA (Vite) at `src/admin/` — created manually with Vite + React
  + TypeScript + vite-plugin-pwa; package.json, vite.config.ts, tsconfig.json, main.tsx,
  App.tsx, index.html created
- [x] T007 [P] Scaffold .NET 10 solution at `src/api/` following Clean Architecture: created
  four projects — `PersonalSite.Domain` (no deps), `PersonalSite.Application` (→ Domain),
  `PersonalSite.Infrastructure` (→ Application + Domain), `PersonalSite.Api` (→ all) —
  with project references enforcing the dependency rule; `PersonalSite.slnx` created;
  `dotnet build` passes with 0 errors, 0 warnings
- [x] T008 [P] Scaffold Strapi v4 project at `cms/` — created manually (interactive CLI
  skipped); package.json, config/database.ts, config/server.ts, config/plugins.ts,
  Dockerfile.dev, .env.example created with SQLite default + Azure Storage toggle
- [x] T009 Create `docker-compose.yml` at repo root with SQL Server 2022 (port 1433) and
  Strapi (port 1337) services; Strapi data in named Docker volume
- [x] T010 [P] Create `.env.example` files for `src/site/`, `src/admin/`, and
  `src/api/PersonalSite.Api/appsettings.Development.example.json` with all required variables
  documented but no real secrets
- [x] T011 Create skeleton GitHub Actions workflows: `.github/workflows/ci.yml`,
  `.github/workflows/public-site.yml`, `.github/workflows/admin-pwa.yml`,
  `.github/workflows/api.yml` — full build/deploy steps included (Lighthouse CI commented out
  pending staging URL)
- [x] T012 [P] Create `infra/parameters.example.ps1` documenting all required Azure
  parameters: `$ResourceGroup`, `$Location`, `$SubscriptionId`, `$AppName`, `$Environment`
  plus all service-specific parameters with comments

**Checkpoint**: All four services start locally (`docker-compose up -d`, `npm run dev`,
`dotnet run`, Strapi). VS Code workspace loads with no errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Design system tokens, shared components, Content Abstraction Layer, .NET
project references, EF Core setup, and Strapi upload provider. MUST be complete before any
section implementation can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T013 Add NuGet package references per Clean Architecture layer:
  - `PersonalSite.Infrastructure`: `Microsoft.EntityFrameworkCore.SqlServer`,
    `Microsoft.EntityFrameworkCore.Design`, `Hangfire.SqlServer`, `Hangfire.AspNetCore`,
    `Azure.Communication.Email`, `WebPush` (v1.0.12 — 3.0.0 does not exist)
  - `PersonalSite.Application`: `Microsoft.IdentityModel.Tokens`, `FluentValidation`
  - `PersonalSite.Api`: `Microsoft.AspNetCore.Authentication.JwtBearer`,
    `Swashbuckle.AspNetCore` (SignalR is built into ASP.NET Core 10 — no separate package)
- [x] T014 [P] Verify `.csproj` project references enforce Clean Architecture dependency rule:
  Domain has no refs; Application → Domain only; Infrastructure → Application + Domain;
  Api → all three; confirm with `dotnet build` (0 errors)
- [x] T015 Create global design tokens at `src/site/src/design/tokens.ts` with all color,
  font, space, radius, motion, and breakpoint values from spec §1.1
- [x] T016 [P] Create global CSS at `src/site/src/design/global.css` importing self-hosted
  fonts (Playfair Display, DM Sans, JetBrains Mono) and CSS custom properties from tokens
- [x] T017 [P] Download and commit Playfair Display, DM Sans, and JetBrains Mono font files
  to `src/site/public/fonts/` (from Google Fonts); add `@font-face` declarations to
  `global.css` — placeholder `.woff2` files committed; replace with real files from
  fonts.google.com before deploying (gitignored, see README.md in fonts/)
- [x] T018 Create CAL TypeScript interfaces at `src/site/src/content/interfaces/index.ts`
  exactly matching data-model.md Part 1 (IMedia, IMilestone, IFamilyMember, IProject,
  IReading, IMusingPost, IInterestCluster, IResumeData, and sub-types)
- [x] T019 Create `IContentAdapter` interface at
  `src/site/src/content/adapters/IContentAdapter.ts` per data-model.md
- [x] T020 Create Strapi adapter stub at `src/site/src/content/adapters/strapi/index.ts`
  implementing `IContentAdapter` — all methods return empty arrays / null initially;
  production adapter MUST propagate fetch errors (never swallow — build must fail if
  Strapi is unreachable)
- [x] T021 Create CAL entry point at `src/site/src/content/index.ts` exporting
  `strapiAdapter as content` (single-line CMS switch point)
- [x] T022 Configure `@strapi/provider-upload-azure-storage` in `cms/config/plugins.ts`
  for Blob Storage uploads (reads `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_CONTAINER` from env)
- [x] T023 [P] Create shared shell component `<NavBar>` at
  `src/site/src/components/NavBar.astro` — sticky top nav, hamburger on mobile, uses tokens
- [x] T024 [P] Create shared shell component `<Footer>` at
  `src/site/src/components/Footer.astro` — links, newsletter CTA slot, copyright
- [x] T025 [P] Create shared shell component `<SectionWrapper>` at
  `src/site/src/components/SectionWrapper.astro` — padding, max-width, scroll anchor
- [x] T026 [P] Create shared components `<Button>`, `<Tag>`, `<Modal>`, `<LoadingState>`,
  `<ErrorBoundary>` at `src/site/src/components/` using design tokens
- [x] T027 Create Astro layout `src/site/src/layouts/BaseLayout.astro` composing NavBar +
  slot + Footer; applies global.css; includes `<meta>` tags for SEO
- [x] T028 Set up EF Core `ApplicationDbContext` in
  `PersonalSite.Infrastructure/Persistence/ApplicationDbContext.cs` with `DbSet` for all
  entities in data-model.md Part 2; configure Azure SQL connection string via options
  injected from `PersonalSite.Api/Program.cs` (Infrastructure has no direct config access)
- [x] T029 Create initial EF Core migration `InitialCreate` in
  `PersonalSite.Infrastructure/Persistence/Migrations/` — run:
  `dotnet ef migrations add InitialCreate --project PersonalSite.Infrastructure --startup-project PersonalSite.Api`
- [x] T030 Configure Hangfire in `PersonalSite.Api/Program.cs` with
  `UseSqlServerStorage()` pointing to same connection string as EF Core

**Checkpoint**: `astro build` succeeds (0 errors, 0 warnings). `dotnet build` succeeds
(0 errors). Public site loads with NavBar + Footer. CAL returns empty arrays without errors.

---

## Phase 3: User Story 1 — Shell Sections + .NET API (Priority: P1) 🎯 MVP

**Goal**: All seven T0 public shell sections render with real content from Strapi. The
.NET API handles contact form submissions. The site is publicly accessible and passes
Lighthouse CI.

**Independent Test**: Deploy public site to staging Azure Static Web Apps. All seven shell
routes load without errors. Contact form submits and owner receives email notification.
Lighthouse Performance ≥ 90 on mobile.

### Strapi Content Type Setup for Shell Sections

- [x] T031 [P] [US1] Create Strapi collection type `project` in `cms/src/api/project/`
  with fields: slug, title, status (enum), description, body (rich text), tags (JSON),
  links (JSON), featured (bool); configure relations to media
- [x] T032 [P] [US1] Create Strapi collection type `reading` in `cms/src/api/reading/`
  with fields: title, author, type (enum), status (enum), rating (int), note, noteIsGated
  (bool), dateAdded, clusters (relation to interest-cluster)
- [x] T033 [P] [US1] Create Strapi collection type `interest-cluster` in
  `cms/src/api/interest-cluster/` with fields: slug, label, description, color
- [x] T034 [P] [US1] Create Strapi single type `resume-data` in `cms/src/api/resume-data/`
  with fields: downloadUrl, education (JSON), experience (JSON), skills (JSON), languages
  (JSON), certifications (JSON)
- [x] T035 [P] [US1] Seed Strapi with sample content: 3 projects, 5 readings, 2 clusters,
  and resume data via Strapi admin UI; export as fixture to `cms/scripts/seed-data.json`

### Strapi Adapter Implementation for Shell Sections

- [x] T036 [US1] Implement `getProjects()` and `getProject(slug)` in the Strapi adapter
  at `src/site/src/content/adapters/strapi/index.ts`; map Strapi REST response to
  `IProject` interface; prefix media URLs with CDN base URL from env
- [x] T037 [US1] Implement `getReadings()` and `getClusters()` in the Strapi adapter;
  map to `IReading[]` and `IInterestCluster[]`
- [x] T038 [US1] Implement `getResumeData()` in the Strapi adapter; map to `IResumeData`

### Shell Section: Home

- [x] T039 [US1] Create `src/site/src/pages/index.astro` using BaseLayout; compose
  `<HeroBlock>`, `<IdentityStrip>`, `<SectionPreviewGrid>`, `<NewsletterCTA>`
- [x] T040 [P] [US1] Create `src/site/src/sections/home/HeroBlock.astro` — full-viewport
  hero with display name placeholder, tagline, animated scroll cue; respects
  `prefers-reduced-motion`; uses `tokens.motion.base` (≤200ms)
- [x] T041 [P] [US1] Create `src/site/src/sections/home/IdentityStrip.astro` — animated
  identity tokens ("Engineer. Reader. Sister. Dreamer."); static fallback for
  `prefers-reduced-motion`
- [x] T042 [P] [US1] Create `src/site/src/sections/home/SectionPreviewGrid.astro` —
  card grid of all sections; each card teases the section's visual language
- [x] T043 [P] [US1] Create `src/site/src/sections/home/NewsletterCTA.astro` — inline
  email subscription form (non-popup); submits to `/api/newsletter/subscribe`

### Shell Section: Projects

- [x] T044 [US1] Create `src/site/src/pages/projects/index.astro` — fetches `getProjects()`
  via CAL; passes data to `<ProjectGrid>`
- [x] T045 [P] [US1] Create `src/site/src/sections/projects/ProjectGrid.astro` —
  filterable grid by status and tag; featured projects render as hero cards
- [x] T046 [P] [US1] Create `src/site/src/sections/projects/ProjectCard.astro` —
  compact and featured variants; status badge with color coding
- [x] T047 [P] [US1] Create `src/site/src/sections/projects/StatusBadge.astro` —
  idea / in-progress / completed / paused with matching token colors
- [x] T048 [US1] Create `src/site/src/pages/projects/[slug].astro` — featured project
  detail page; fetches `getProject(slug)` via CAL; renders body rich text, links, media

### Shell Section: Resume

- [x] T049 [US1] Create `src/site/src/pages/resume.astro` — fetches `getResumeData()`
  via CAL; renders `<ResumeView>`; includes download button
- [x] T050 [P] [US1] Create `src/site/src/sections/resume/ResumeView.astro` — renders
  Education, Experience, Skills, Languages, Certifications sections; includes print
  stylesheet (`@media print`)
- [x] T051 [P] [US1] Create `src/site/src/sections/resume/DownloadResumeButton.astro` —
  links to `IResumeData.downloadUrl` (Azure Blob); triggers browser download

### Shell Section: Readings

- [x] T052 [US1] Create `src/site/src/pages/readings.astro` — fetches `getReadings()` and
  `getClusters()` via CAL; passes to `<ReadingList>`
- [x] T053 [P] [US1] Create `src/site/src/sections/readings/ReadingList.astro` —
  filterable by type, status, and cluster; list and card grid view toggle
- [x] T054 [P] [US1] Create `src/site/src/sections/readings/ReadingCard.astro` — displays
  title, author, type badge, status, rating; renders `<GatedNoteTeaser>` for T1-gated notes
- [x] T055 [P] [US1] Create `src/site/src/sections/readings/GatedNoteTeaser.astro` — shows
  subscribe prompt to T0 users; full note for T1 (subscriber token check via API)

### Shell Section: Musings

- [x] T056 [US1] Implement `getMusings()` and `getMusing(slug)` in the Strapi adapter
- [x] T057 [US1] Create Strapi collection types `musing-post` and ensure `interest-cluster`
  relation is set up in `cms/src/api/musing-post/`
- [x] T058 [US1] Create `src/site/src/pages/musings/index.astro` — fetches public musings
  + clusters; renders `<MusingsLanding>`
- [x] T059 [P] [US1] Create `src/site/src/sections/musings/MusingsLanding.astro` —
  cluster-grouped layout; public posts visible; subscriber-only posts show
  `<SubscriberGate>`
- [x] T060 [P] [US1] Create `src/site/src/sections/musings/MusingPostCard.astro` —
  tier-aware rendering: full teaser for public, locked state for subscriber-only
- [x] T061 [P] [US1] Create `src/site/src/sections/musings/SubscriberGate.astro` —
  lock overlay with subscribe CTA; shows excerpt from `IMusingPost.excerpt`
- [x] T062 [US1] Create `src/site/src/pages/musings/[slug].astro` — full musing post
  page; checks subscriber token before rendering gated content

### Shell Section: Reach Out

- [x] T063 [US1] Create `src/site/src/pages/reach-out.astro` — renders `<ContactForm>`
  React island (requires interactivity for validation + submission)
- [x] T064 [US1] Create `src/site/src/sections/reach-out/ContactForm.tsx` — React island;
  fields: name, email, subject (dropdown), message (max 1000 chars), honeypot (hidden);
  client-side validation; POST to `VITE_API_URL/api/contact`; success/error states

### Shell Section: Links

- [x] T065 [US1] Create Strapi single type `site-links` in `cms/src/api/site-links/` with
  fields: links (JSON array of `{ label, url, icon }`)
- [x] T066 [US1] Add `getSiteLinks()` method to `IContentAdapter` and Strapi adapter
- [x] T067 [P] [US1] Create `src/site/src/pages/links.astro` — fetches links via CAL;
  renders icon + label + URL for each; also rendered in Footer

### .NET API: Core Setup

- [x] T068 [US1] Configure ASP.NET Core middleware in `PersonalSite.Api/Program.cs`:
  CORS (allow Static Web Apps origin), rate limiting middleware (sliding window 3/IP/hour),
  Swagger (development only); NoOpEmailService dev stub when ACS not configured
- [x] T069 [P] [US1] Create `ContactSubmission` entity in `PersonalSite.Domain/Entities/`
  with fields from data-model.md; add `DbSet<ContactSubmission>` to `ApplicationDbContext`
  in `PersonalSite.Infrastructure/Persistence/`
- [x] T070 [P] [US1] Create `SubmitContactFormCommand` + `SubmitContactFormHandler` in
  `PersonalSite.Application/UseCases/Contact/`; define `IEmailService` and
  `IContactRepository` interfaces in `PersonalSite.Application/Interfaces/`; handler
  validates, saves via repository, calls `IEmailService`
- [x] T071 [US1] Implement `ContactController` in `PersonalSite.Api/Controllers/` —
  receives request, enforces rate limit (3/IP/hour via `[EnableRateLimiting("contact")]`),
  checks honeypot, dispatches `SubmitContactFormCommand` via direct handler injection
- [x] T072 [US1] Implement `EmailService : IEmailService` in
  `PersonalSite.Infrastructure/Services/` using `Azure.Communication.Email` SDK; registered
  in DI from `PersonalSite.Api/Program.cs`; `ContactRepository` implements `IContactRepository`
- [x] T073 [US1] Create `infra/setup.ps1` idempotent Azure IaC script: Resource Group,
  App Service Plan (B1 Linux, shared), .NET API + Strapi App Services, Azure SQL, Blob
  Storage, ACS, Static Web Apps — all idempotent, cost gate documented (≤€30/month)

### Build Gate — Phase 3

- [x] T074 [US1] Run `astro check` in `src/site/` — 0 errors, 0 warnings across 40 files;
  all type errors in CAL interfaces and component props fixed (Tag slot, SectionWrapper
  aria-label, IContentAdapter ISiteLink)
- [x] T075 [US1] Run `dotnet build src/api/PersonalSite.slnx` — 0 errors, 0 warnings;
  all five projects compile cleanly (Domain, Application, Infrastructure, Api, Tests)
- [ ] T076 [US1] Run Lighthouse CI on at least: `/`, `/projects`, `/resume`, `/reach-out` —
  verify Performance ≥ 90, Accessibility ≥ 95 on mobile viewport
- [ ] T077 [US1] Smoke test `POST /api/contact` against local API — verify 200 response
  and DB record created; verify 429 on 4th submission within 1 hour from same IP

**Checkpoint**: All 7 shell sections render. Contact form works. Build gate passes.
Phase 3 is the public MVP — deployable to staging.

---

## Phase 4: User Story 2 — Subscriber System (Priority: P2)

**Goal**: Visitors can subscribe to interest clusters. Subscribers (T1) unlock gated
content in Musings and Readings. Owner can manage subscribers in Admin PWA (basic).

**Independent Test**: Full subscription flow works end-to-end: subscribe → email → confirm
→ receive token → gated content unlocks. Unsubscribe flow removes access.

### Subscriber Domain & API

- [x] T078 [P] [US2] Create domain entities `Subscriber`, `SubscriberCluster`,
  `PendingSubscription` in `PersonalSite.Domain/Entities/` per data-model.md; add `DbSet`
  entries to `ApplicationDbContext` in `PersonalSite.Infrastructure/Persistence/`
- [x] T079 [US2] Add EF Core migration `AddSubscriberEntities` — subscriber tables included
  in `InitialCreate` migration (entities were already in DbContext when migration was generated)
- [x] T080 [P] [US2] Define `ISubscriptionService`, `ITokenService`, `ISubscriberRepository`
  interfaces in `PersonalSite.Application/Interfaces/`; created use case command/handler pairs
  in `PersonalSite.Application/UseCases/Subscription/` (InitiateSubscription, ConfirmSubscription,
  VerifyToken, Unsubscribe)
- [x] T081 [US2] Implement `SubscriptionService : ISubscriptionService` in
  `PersonalSite.Infrastructure/Services/` — orchestrates domain logic: creates
  `PendingSubscription`, triggers `IEmailService`, issues token via `ITokenService`; sliding-
  window renewal: if token has ≤7 days remaining, `VerifyToken` issues and returns a fresh
  30-day token in `newToken` response field
- [x] T082 [US2] Implement subscription endpoints in
  `PersonalSite.Api/Controllers/NewsletterController.cs`: `POST /api/newsletter/subscribe`,
  `GET /api/newsletter/confirm`, `POST /api/subscriber/verify`,
  `DELETE /api/newsletter/unsubscribe` per `contracts/api.md`; controllers call Application
  use cases only — no business logic in controllers
- [x] T083 [US2] Implement `TokenService : ITokenService` in
  `PersonalSite.Infrastructure/Services/` — subscriber token (30-day, `role: subscriber`,
  `clusters: [...]`), owner token (15-min, `role: owner`) using `Microsoft.IdentityModel.Tokens`

### Frontend: Subscriber Gate Integration

- [x] T084 [US2] Create `src/site/src/services/subscriber.ts` — client-side module that:
  reads `sub_token` from localStorage, calls `POST /api/subscriber/verify`, caches result
  in sessionStorage; exported as `subscriberService`
- [x] T085 [US2] Update `src/site/src/sections/musings/MusingPostCard.astro` — created
  `SubscriberGateIsland.tsx` React island; gated posts hydrate it (`client:load`) for
  client-side token verification; shows post link when verified, lock CTA when not
- [x] T086 [US2] Update `src/site/src/sections/readings/GatedNoteTeaser.astro` — created
  `GatedNoteTeaserIsland.tsx` React island; gated notes hydrate it (`client:load`); reveals
  full note when subscriber has cluster access, shows blurred teaser + CTA otherwise
- [x] T087 [US2] Create `src/site/src/sections/home/NewsletterCTA.tsx` — React island
  (replaces static Astro form); full subscribe form with cluster selection checkboxes;
  success/error/conflict states; `index.astro` upgraded to fetch clusters via CAL and pass
  as props

### Hangfire Newsletter Dispatch

- [x] T088 [US2] Create Strapi collection type `newsletter-dispatch` in
  `cms/src/api/newsletter-dispatch/` with fields: postSlug, clusters (relation), subject,
  status (enum: draft/sent), sentAt
- [x] T089 [US2] Implement `NewsletterDispatchJob` in
  `PersonalSite.Infrastructure/Jobs/NewsletterDispatchJob.cs` using Hangfire:
  - Query active subscribers by cluster slugs
  - Batch emails via `EmailService` (max 50 per batch)
  - Update dispatch record status on completion
- [x] T090 [US2] Implement `POST /api/admin/newsletter/dispatch` in
  `PersonalSite.Api/Controllers/AdminNewsletterController.cs` — enqueue Hangfire job;
  return 202 with job ID

**Checkpoint**: Full subscriber lifecycle works. Gated content locks/unlocks correctly.
Newsletter dispatch queues and sends. Build gate passes (T074–T077 pattern).

---

## Phase 5: User Story 3 — Immersive Modules (Priority: P3)

**Goal**: Life Map and Meet the Family sections are fully interactive and visually distinct
from the shell layer. They use their own visual logic and motion language.

**Independent Test**: Life Map loads `IMilestone[]` from CAL and renders interactive
timeline. Meet the Family loads `IFamilyMember[]` and renders interactive family scene.
Both sections pass Lighthouse AA accessibility for informational content.

### Strapi Content Types for Immersive Modules

- [x] T091 [P] [US3] Create Strapi collection type `milestone` in `cms/src/api/milestone/`
  with fields: date, title, description, category (enum including 'future'), media
  (relation), featured (bool), order (int)
- [x] T092 [P] [US3] Create Strapi collection type `family-member` in
  `cms/src/api/family-member/` with fields: name, relation, tagline, photo (media), funFacts
  (JSON array), emoji, order (int)
- [x] T093 [US3] Seed Strapi with sample milestones (5+) and family members (3+) via admin
  UI; include at least 1 featured milestone and 1 milestone with `category: 'future'`; added
  7 milestones (3 featured, 1 future) and 3 family members to `cms/scripts/seed-data.json`

### CAL Adapter: Immersive Data

- [x] T094 [P] [US3] Implement `getMilestones()` in the Strapi adapter at
  `src/site/src/content/adapters/strapi/index.ts`; map to `IMilestone[]`; sort by date
- [x] T095 [P] [US3] Implement `getFamilyMembers()` in the Strapi adapter; map to
  `IFamilyMember[]`; sort by `order` field

### Life Map Section (Immersive)

- [x] T096 [US3] Create `src/site/src/pages/life-map.astro` — fetches `getMilestones()`
  via CAL; passes to `<LifeMapCanvas>` React island; no BaseLayout (immersive — own layout)
- [x] T097 [US3] Create `src/site/src/sections/life-map/LifeMapCanvas.tsx` — React island;
  orchestrates scroll state; renders `<TimelinePath>` + array of `<MilestoneNode>`;
  implements category filter state; desktop: horizontal scroll; mobile: vertical scroll
- [x] T098 [P] [US3] Create `src/site/src/sections/life-map/TimelinePath.tsx` — SVG or
  CSS animated connector path between milestone nodes; animates on scroll using
  Intersection Observer; respects `prefers-reduced-motion`
- [x] T099 [P] [US3] Create `src/site/src/sections/life-map/MilestoneNode.tsx` — dot/icon
  on path; hover/tap reveals `<MilestoneCard>`; featured nodes are visually larger; future
  milestones have distinct visual indicator
- [x] T100 [P] [US3] Create `src/site/src/sections/life-map/MilestoneCard.tsx` — expanded
  detail card: title, date (mono font), description, media (if any); closes on outside click
  or Escape key
- [x] T101 [P] [US3] Create `src/site/src/sections/life-map/CategoryFilter.tsx` — pill
  group filter by milestone category; updates LifeMapCanvas filter state
- [x] T102 [US3] Apply immersive visual language to Life Map: dark/saturated background
  token, immersive motion tokens (`tokens.motion.immersive`), date labels in
  `tokens.font.mono`; add `data-layer="immersive"` attribute for CSS scoping

### Meet the Family Section (Immersive)

- [x] T103 [US3] Create `src/site/src/pages/family.astro` — fetches `getFamilyMembers()`
  via CAL; passes to `<FamilyScene>` React island; no BaseLayout (immersive)
- [x] T104 [US3] Create `src/site/src/sections/family/FamilyScene.tsx` — React island;
  renders family members as positioned spots in a scene composition; manages selected
  member state; supports keyboard navigation
- [x] T105 [P] [US3] Create `src/site/src/sections/family/FamilyMemberSpot.tsx` — tappable/
  clickable character position; triggers member card display on activation; uses member's
  optional signature emoji overlay
- [x] T106 [P] [US3] Create `src/site/src/sections/family/FamilyMemberCard.tsx` — detail
  panel: photo, name, relation, tagline, 2–3 fun facts; slide-in animation; ARIA role
  `dialog` for accessibility
- [x] T107 [P] [US3] Create `src/site/src/sections/family/FamilyNav.tsx` — prev/next
  navigation between family members; supports swipe gesture on mobile
- [x] T108 [US3] Apply immersive visual language to Family section: warm/playful token
  palette distinct from shell and Life Map; `data-layer="immersive"` attribute

### Section Preview Grid Update

- [x] T109 [US3] Update `src/site/src/sections/home/SectionPreviewGrid.astro` — Life Map
  card previews dark timeline aesthetic; Family card previews playful style; cards link to
  `/life-map` and `/family`; `immersive: true` flag adds dark-tinted card style and badge

**Checkpoint**: Both immersive sections load and are interactive. Timeline path animates.
Family scene is navigable. Lighthouse AA passes for informational content. Build gate passes.

---

## Phase 6: User Story 4 — Cross-Cutting Features + Admin PWA (Priority: P4)

**Goal**: Visitor fingerprinting, real-time presence, push notifications, and the Admin PWA
are fully functional. Owner can monitor the site and manage content operations from the PWA.

**Independent Test**: Admin PWA accessible at `localhost:5173`; owner can log in, see active
visitors in real time, read contact submissions, view subscriber list, and trigger newsletter
dispatch.

### Visitor Fingerprinting

- [x] T110 [P] [US4] Create `Visitor` entity in `PersonalSite.Domain/Entities/` per
  data-model.md; add `DbSet<Visitor>` to `ApplicationDbContext`; add EF migration
  `AddVisitorEntity` — entity + DbSet were in InitialCreate; added `CurrentPage` field +
  `AddVisitorCurrentPage` migration
- [x] T111 [P] [US4] Implement `VisitorService` in
  `PersonalSite.Infrastructure/Services/VisitorService.cs`: `IdentifyVisitor()` — upsert
  visitor by fingerprint, increment visit count, set `DataPurgeAt = now + 12 months`
- [x] T112 [US4] Implement `POST /api/visitor/identify` in
  `PersonalSite.Api/Controllers/VisitorController.cs` per `contracts/api.md`;
  upsert visitor record, return `{ returning, visitCount }`
- [x] T113 [US4] Add `fingerprintjs/fingerprintjs` to `src/site/` dependencies; create
  `src/site/src/services/fingerprint.ts` — initializes FingerprintJS OSS on page load, gets
  visitor ID, POSTs to `/api/visitor/identify`; exports `{ returning, visitCount }` result
- [x] T114 [US4] Update `src/site/src/sections/home/HeroBlock.astro` — hydrate a React
  island that calls `fingerprint.ts` on load; if `returning === true`, render subtle
  "Welcome back" personalization text

### SignalR: Real-Time Presence

- [x] T116 [US4] Add Azure SignalR Service configuration to `PersonalSite.Api/Program.cs`
  using `AddSignalR().AddAzureSignalR()`; add `PresenceHub` to `MapHub<PresenceHub>` at
  `/hubs/presence` — using built-in SignalR (no Azure SignalR pkg needed for local dev);
  `PresencePruneService` registered as `IHostedService`
- [x] T117 [US4] Implement `PresenceHub` in `PersonalSite.Api/Hubs/PresenceHub.cs`:
  `SendHeartbeat()` server method (upserts visitor, broadcasts update to admin group);
  admin clients join `admin` group on connect (validated by owner JWT); prune inactive
  visitors (no heartbeat in 2 min) every 60 seconds via `IHostedService`
- [x] T118 [US4] Create `src/site/src/services/presence.ts` — client-side SignalR
  connection to `/hubs/presence`; calls `SendHeartbeat` on load and every 30s; disconnects
  on page unload; only connects if consent given

### Admin PWA: Auth

- [x] T119 [P] [US4] Create `OwnerSession` entity in `PersonalSite.Domain/Entities/` per
  data-model.md; add `DbSet<OwnerSession>` to `ApplicationDbContext`; add EF migration
  `AddOwnerSession` — entity + DbSet + migration were in InitialCreate
- [x] T120 [US4] Implement `AdminAuthController` in `PersonalSite.Api/Controllers/`:
  `POST /api/admin/auth/login`, `POST /api/admin/auth/refresh`,
  `POST /api/admin/auth/logout` per `contracts/api.md`; login validates owner credentials
  from app settings (hashed), issues JWT access token + HttpOnly refresh cookie
- [x] T121 [US4] Create `src/admin/src/services/authService.ts` — login, refresh (on 401),
  logout; stores access token in memory (not localStorage — short expiry); uses Axios
  interceptor for automatic token refresh
- [x] T122 [US4] Create `src/admin/src/pages/LoginPage.tsx` — email + password form;
  calls `authService.login()`; redirects to Dashboard on success
- [x] T123 [US4] Create `src/admin/src/hooks/useAuth.ts` — auth context; wrap app in
  `<AuthProvider>`; redirect to `/login` if no valid session

### Admin PWA: Dashboard

- [x] T124 [US4] Implement admin endpoints in `PersonalSite.Api/Controllers/AdminController.cs`:
  `GET /api/admin/visitors`, `GET /api/admin/contacts`, `PATCH /api/admin/contacts/{id}/read`,
  `GET /api/admin/subscribers`, `PATCH /api/admin/subscribers/{id}/deactivate` per
  `contracts/api.md`; protected by `[Authorize(Roles = "owner")]`
- [x] T125 [US4] Create `src/admin/src/hooks/useSignalR.ts` — SignalR connection to
  `/hubs/presence` with owner auth header; exposes `activeVisitors` state; auto-reconnect
  with exponential backoff
- [x] T126 [US4] Create `src/admin/src/pages/DashboardPage.tsx` — composites:
  `<LiveVisitorCount>`, `<ActiveVisitorTable>`, `<RecentNotifications>`; uses `useSignalR`
- [x] T127 [P] [US4] Create `src/admin/src/pages/ContactsPage.tsx` — paginated list of
  contact submissions; mark-as-read action; filter: unread only
- [x] T128 [P] [US4] Create `src/admin/src/pages/SubscribersPage.tsx` — subscriber list
  with cluster filter; deactivate action
- [x] T129 [P] [US4] Create `src/admin/src/pages/NewsletterPage.tsx` — dispatch form:
  enter postSlug, select clusters, enter subject; calls
  `POST /api/admin/newsletter/dispatch`; shows Hangfire job status

### Push Notifications

- [x] T130 [P] [US4] Create `OwnerPushSubscription` entity per data-model.md; add EF
  migration `AddPushSubscription` — entity + DbSet + migration were in InitialCreate
- [x] T131 [US4] Implement `PUT /api/admin/push/register` and
  `DELETE /api/admin/push/unregister` in `PersonalSite.Api/Controllers/AdminPushController.cs`
- [x] T132 [US4] Implement `PushNotificationService` in
  `PersonalSite.Infrastructure/Services/PushNotificationService.cs` using `WebPush` library
  + VAPID keys from Azure Key Vault; `SendToOwner()` dispatches on new contact, new
  subscriber, or visitor milestone events
- [x] T133 [US4] Create `src/admin/public/service-worker.js` — handles `push` events,
  displays notification via `showNotification()`; handles `notificationclick` to focus app
- [x] T134 [US4] Create `src/admin/public/manifest.json` — name, icons, `display:
  standalone`, theme color; vite-plugin-pwa updated to use injectManifest strategy
- [x] T135 [US4] Create `src/admin/src/hooks/usePush.ts` — requests notification permission
  on first install; registers service worker; POSTs push subscription to
  `PUT /api/admin/push/register`

### Build Gate — Phase 6

- [x] T136 [US4] Run full build gate: `dotnet build` ✅ 0 errors, 0 warnings. `astro build`
  client bundles ✅ 0 errors. Static generation fetch-fails are pre-existing (Strapi not
  running locally — same behaviour as Phase 5). Lighthouse CI + smoke tests require staging.

**Checkpoint**: All cross-cutting features functional. Admin PWA accessible and usable.
Real-time visitor dashboard updates live. Push notifications delivered on events.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: CI/CD pipelines, Azure infra completion, performance hardening, and final
deployment verification.

- [ ] T137 [P] Complete `infra/setup.ps1` with all remaining Azure resources: Static Web
  Apps (public site + admin PWA), SQL Database (Basic 5 DTU), Blob Storage (LRS Hot),
  Microsoft CDN, Azure Communication Services, SignalR Service (Free), Azure Key Vault;
  add all existence-check guards; print manual steps checklist at end
- [ ] T138 [P] Write `infra/SETUP_GUIDE.md` — numbered steps for: DNS configuration,
  GitHub repository secrets, Azure AD app registration (if any), VAPID key generation,
  post-setup verification checklist
- [ ] T139 Complete `.github/workflows/ci.yml` — PR validation: `astro build`, `dotnet build`,
  Lighthouse CI (thresholds: Performance ≥ 90, Accessibility ≥ 95), `dotnet test`
- [ ] T140 [P] Complete `.github/workflows/public-site.yml` — build Astro, deploy to Azure
  Static Web Apps using `azure/static-web-apps-deploy@v1`; runs on push to `main`
- [ ] T141 [P] Complete `.github/workflows/admin-pwa.yml` — build React SPA, deploy to
  Azure Static Web Apps (separate slot); runs on push to `main`
- [ ] T142 [P] Complete `.github/workflows/api.yml` — `dotnet publish`, deploy to Azure
  App Service Linux using `azure/webapps-deploy@v3`; runs on push to `main`
- [ ] T143 Add Hangfire data purge job in `PersonalSite.Infrastructure/Jobs/DataPurgeJob.cs`
  — daily job deletes `Visitor` records where `DataPurgeAt < DateTime.UtcNow`; GDPR
  compliance
- [ ] T144 [P] Add `<link rel="canonical">` and OpenGraph meta tags to `BaseLayout.astro`;
  add `robots.txt` and `sitemap.xml` generation to Astro config
- [ ] T145 [P] Audit all shell pages for Core Web Vitals: verify all images have explicit
  `width` + `height`; verify no render-blocking third-party scripts; run
  `npm run build && npx lhci autorun` locally
- [ ] T146 [P] Add Application Insights sampling configuration to `PersonalSite.Api` —
  `AddApplicationInsightsTelemetry()` with adaptive sampling; reads instrumentation key
  from Azure Key Vault
- [ ] T147 Run end-to-end deployment to staging environment: provision Azure resources via
  `infra/setup.ps1`, deploy all four components, verify all sections live, run Lighthouse
  CI against staging URLs, confirm contact form sends email to owner

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **Phase 3 (US1 — Shell + API)**: Depends on Phase 2 — builds on design system + CAL
- **Phase 4 (US2 — Subscribers)**: Depends on Phase 3 (contact form → email infra reused)
- **Phase 5 (US3 — Immersive)**: Can start concurrently with Phase 4 after Phase 2 completes
- **Phase 6 (US4 — Admin PWA)**: Depends on Phase 4 (subscriber API needed for admin)
- **Polish**: Depends on all user story phases completing

### Parallel Opportunities Within Phases

**Phase 3 — Shell Sections**: Once T068 (.NET API setup) is done, shell sections and .NET
API tasks are independent. Strapi content type setup (T031–T035) can run in parallel with
design system component tasks.

```
# Parallel group A — Strapi setup:
T031 Create project content type
T032 Create reading content type
T033 Create interest-cluster content type
T034 Create resume-data single type

# Parallel group B — .NET API:
T068 Configure API middleware
T069 Create ContactSubmission entity
T070 Create contact DTOs

# Parallel group C — Shell sections (after CAL adapter T036–T038):
T039–T043 Home section
T044–T048 Projects section
T049–T051 Resume section
T052–T055 Readings section
```

**Phase 5 — Immersive Modules**: Life Map and Meet the Family are fully independent.

```
# Life Map tasks (T096–T102) in parallel with Family tasks (T103–T109)
```

**Phase 6 — Admin PWA**: Frontend Admin PWA pages (T126–T129) are independent of each
other after auth (T119–T123) is complete.

---

## Implementation Strategy

### MVP First (Phase 3 — US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (design system + CAL + shared components)
3. Complete Phase 3: US1 (all shell sections + contact form API)
4. **STOP and VALIDATE**: Deploy to staging, run Lighthouse CI, test contact form
5. Demo/review with owner — confirm accent color and copy

### Incremental Delivery

1. Setup + Foundation → local dev fully working
2. US1 (Shell + API) → public site live with all 7 sections — **public launch point**
3. US2 (Subscribers) → T1 content gating works; newsletter sends
4. US3 (Immersive) → Life Map + Family sections live
5. US4 (Admin PWA) → owner operational dashboard live
6. Polish → CI/CD complete, Azure fully provisioned

---

## Notes

- `[P]` tasks = different files, no dependencies within their phase
- `[US#]` label maps task to a specific delivery phase
- Build gate runs at the end of US1, US2, US4, and Polish phases
- Accent color `#D4522A` is a placeholder — owner must confirm before Phase 3 colored
  components are finalized (see research.md Decision 8)
- Test tasks not generated — add them per story if TDD approach is desired
- All PowerShell scripts use `.ps1` extension; no bash scripts
- Line endings: CRLF throughout (enforced by `.gitattributes` and VS Code settings)
