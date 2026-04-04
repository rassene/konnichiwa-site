# konnichiwa-site Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-04

## Active Technologies

- TypeScript (Astro 4.x + React 18), C# (.NET 8), TypeScript (Strapi v4) + Astro 4, React 18, ASP.NET Core 8, Entity Framework Core 8, (main)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (Astro 4.x + React 18), C# (.NET 8), TypeScript (Strapi v4): Follow standard conventions

## Recent Changes

- main: Added TypeScript (Astro 4.x + React 18), C# (.NET 8), TypeScript (Strapi v4) + Astro 4, React 18, ASP.NET Core 8, Entity Framework Core 8,

<!-- MANUAL ADDITIONS START -->
## Real Project Structure

```text
src/site/        ← Astro 4 public site (npm run dev → localhost:4321)
src/admin/       ← Admin PWA React SPA (npm run dev → localhost:5173)
src/api/         ← .NET 8 solution (dotnet run → localhost:5000)
  PersonalSite.Api/
  PersonalSite.Application/
  PersonalSite.Domain/
  PersonalSite.Infrastructure/
  PersonalSite.Tests/
cms/             ← Strapi v4 (docker-compose → localhost:1337)
infra/           ← Azure IaC PowerShell (setup.ps1 — idempotent)
specs/main/      ← project spec, plan, data model, contracts, quickstart
```

## Key Architectural Rules

- All content access goes through `/src/site/src/content/index.ts` (CAL). Never import
  Strapi SDK directly in components.
- Shell sections and Immersive sections (Life Map, Meet the Family) are separate visual
  registers — do not mix their styles or motion patterns.
- All scripts must be PowerShell (.ps1). No bash scripts, no WSL.
- Line endings: CRLF throughout. `"files.eol": "\r\n"` in VS Code settings.
- JS bundle per shell route: ≤ 50 KB gzipped (Astro zero-JS baseline).
- Every hydrated React island must justify its JS cost in a comment.

## Build Commands

```powershell
# Public site
cd src/site && npm run dev        # dev server
cd src/site && npm run build      # production build (must have 0 errors, 0 warnings)

# Admin PWA
cd src/admin && npm run dev

# .NET API
cd src/api && dotnet run --project PersonalSite.Api
cd src/api && dotnet test

# Local services (SQL Server + Strapi)
docker-compose up -d
```

## Constitution

All development follows `.specify/memory/constitution.md` (v1.0.0).
Key principles: Dual-Layer Architecture, CAL, Owner Autonomy, Mobile-First Performance,
Incremental Build Verification, Azure Cost Governance (≤ €30/month).

## Specs & Plan

- Full project spec: `specs/main/spec.md`
- Implementation plan: `specs/main/plan.md`
- Data model: `specs/main/data-model.md`
- API contract: `specs/main/contracts/api.md`
- SignalR contract: `specs/main/contracts/signalr.md`
- Local dev quickstart: `specs/main/quickstart.md`
<!-- MANUAL ADDITIONS END -->
