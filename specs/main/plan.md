# Implementation Plan: Konnichiwa — Personal Website

**Branch**: `main` | **Date**: 2026-04-04 | **Spec**: [specs/main/spec.md](specs/main/spec.md)
**Input**: Feature specification from `/specs/main/spec.md`

## Summary

A multi-tier personal website for a young adult woman, built on Astro (public site) +
React SPA (Admin PWA) + ASP.NET Core 8 API + Strapi CMS, hosted entirely on Azure.
The site exposes nine sections across two visual registers (Shell and Immersive), a
subscriber-gated content tier (T1), and an owner-only Admin PWA with real-time visitor
presence and push notifications.

Implementation is organized into four sequential delivery phases, each ending with a
mandatory build gate:

1. **Foundation** — repo scaffold, Azure infra, local dev environment
2. **Design System + CAL + CMS** — tokens, shared components, content abstraction, Strapi
3. **Shell Sections** — all T0/T1 shell-layer pages + .NET API
4. **Immersive Modules + Cross-Cutting Features** — Life Map, Meet the Family, fingerprinting,
   newsletter, real-time presence, Admin PWA

## Technical Context

**Language/Version**: TypeScript (Astro 4.x + React 18), C# (.NET 10), TypeScript (Strapi v4)
**Architecture (.NET API)**: Clean Architecture — Domain → Application → Infrastructure → Api
  (strict dependency rule; compile-time enforced via project references)
**Primary Dependencies**: Astro 4, React 18, ASP.NET Core 10, Entity Framework Core 10,
  Strapi v4, Hangfire, `@microsoft/signalr`, `fingerprintjs/fingerprintjs` (OSS),
  Azure Communication Services SDK (.NET)
**Storage**: Azure SQL Database (EF Core — subscriber, contact, visitor, push sub data);
  Azure Blob Storage + Microsoft CDN (media assets, PDF resume);
  SQLite (Strapi CMS — persistent on App Service Linux `/home`)
**Testing**: Vitest (frontend unit), Playwright (E2E / integration flows),
  xUnit + Moq (.NET unit + integration), Lighthouse CI (performance gate)
**Target Platform**: Azure Static Web Apps (public site + Admin PWA); Azure App Service
  Linux B1 (.NET API + Strapi, shared App Service Plan); Windows dev environment
  (VS Code, PowerShell — no WSL, no Unix scripts)
**Project Type**: Full-stack multi-tier web application (public site + Admin PWA +
  REST/SignalR API + headless CMS), monorepo layout
**Performance Goals**: Lighthouse Performance ≥90 (mobile), FCP ≤1.5 s, LCP ≤2.5 s,
  CLS ≤0.1, TBT ≤200 ms, API p95 ≤300 ms
**Constraints**: Azure budget ≤€30/month; JS bundle ≤50 KB gzipped per shell route
  (Astro zero-JS baseline); Windows-only dev (CRLF, PowerShell, no WSL); WCAG 2.1 AA
  (shell); `prefers-reduced-motion` respected everywhere
**Scale/Scope**: Single-owner personal site; 3 audience tiers; 9 public sections;
  low traffic at launch; sole content editor (owner via Strapi admin UI)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Status | Gate Condition |
|---|-----------|--------|----------------|
| I | Dual-Layer Architecture | ✅ PASS | Spec clearly assigns each section to Shell or Immersive. Every component MUST declare its layer before implementation. Shell sections MUST NOT use immersive motion/layout patterns. |
| II | Content Abstraction Layer | ✅ PASS | CAL defined with typed interfaces and Strapi adapter. Gate: no component imports from Strapi SDK directly; all access via `/src/site/src/content/index.ts`. |
| III | Owner Autonomy | ✅ PASS | All content managed via Strapi admin UI. Gate: any owner content operation that requires code is a logged developer task. |
| IV | Mobile-First & Performance | ✅ PASS | Targets defined in spec §7. Gate: Lighthouse CI must pass all thresholds at each phase build gate. Every hydrated island MUST justify its JS cost. |
| V | Incremental Build Verification | ✅ PASS | Four delivery phases each end with a build gate. Gate: `astro build` (0 errors/warnings) + `dotnet build` (0 errors) + Lighthouse CI + API smoke tests — all must pass before next phase begins. |
| VI | Azure Cost Governance | ✅ PASS | B1 App Service Plan shared between API and Strapi. Free tier Static Web Apps. SQLite for Strapi eliminates managed Postgres cost. Gate: `infra/setup.ps1` must be updated before any production Azure change. |

**Result**: All six gates pass. No complexity violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/main/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api.md           # .NET REST API contract
│   └── signalr.md       # SignalR hub contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
[firstname]-site/
  ├── .vscode/
  │   ├── extensions.json
  │   ├── launch.json
  │   └── settings.json
  ├── .github/
  │   └── workflows/
  │       ├── ci.yml              ← PR validation: build + lint + Lighthouse
  │       ├── public-site.yml     ← deploy Astro to Azure Static Web Apps
  │       ├── admin-pwa.yml       ← deploy Admin PWA to Azure Static Web Apps
  │       └── api.yml             ← deploy .NET API to Azure App Service
  ├── infra/
  │   ├── setup.ps1               ← idempotent Azure IaC (az CLI, PowerShell)
  │   ├── parameters.example.ps1  ← all required variables documented
  │   ├── parameters.ps1          ← gitignored — local values
  │   └── SETUP_GUIDE.md
  ├── src/
  │   ├── site/                   ← Astro public site
  │   │   ├── src/
  │   │   │   ├── content/
  │   │   │   │   ├── interfaces/ ← IProject, IMilestone, IMusingPost, …
  │   │   │   │   ├── adapters/
  │   │   │   │   │   └── strapi/ ← Strapi adapter implementation
  │   │   │   │   └── index.ts    ← active adapter export (single-line switch)
  │   │   │   ├── design/
  │   │   │   │   ├── tokens.ts   ← global design tokens
  │   │   │   │   └── global.css
  │   │   │   ├── components/     ← shared shell components (NavBar, Footer, …)
  │   │   │   ├── sections/       ← one folder per site section
  │   │   │   │   ├── home/
  │   │   │   │   ├── life-map/
  │   │   │   │   ├── family/
  │   │   │   │   ├── projects/
  │   │   │   │   ├── readings/
  │   │   │   │   ├── musings/
  │   │   │   │   ├── resume/
  │   │   │   │   ├── reach-out/
  │   │   │   │   └── links/
  │   │   │   └── pages/          ← Astro route pages
  │   │   └── public/             ← fonts (self-hosted), favicon
  │   ├── admin/                  ← Admin PWA (React SPA, Vite)
  │   │   └── src/
  │   │       ├── components/
  │   │       ├── pages/          ← Dashboard, Contacts, Subscribers, Settings
  │   │       ├── hooks/          ← useSignalR, usePush, useAuth
  │   │       └── services/       ← API client, auth service
  │   └── api/                    ← .NET 10 solution (Clean Architecture)
  │       ├── PersonalSite.slnx
  │       ├── PersonalSite.Domain/              ← entities, value objects (no deps)
  │       ├── PersonalSite.Application/         ← use cases, interfaces, DTOs
  │       ├── PersonalSite.Infrastructure/      ← EF Core, email, push, SignalR, jobs
  │       ├── PersonalSite.Api/                 ← ASP.NET Core 10 entry point, controllers
  │       └── PersonalSite.Tests/
  ├── cms/                        ← Strapi v4 project
  └── docker-compose.yml          ← local dev: Strapi + SQL Server
```

**Structure Decision**: Multi-tier monorepo. Each of the four deployable units (public site,
admin PWA, .NET API, Strapi CMS) lives under `src/` or `cms/` with its own build toolchain
and CI/CD pipeline. Shared design tokens and CAL interfaces are internal to `src/site/`;
there is no shared NPM package needed at this scale.

## Complexity Tracking

> No constitution violations detected — this section is empty.
