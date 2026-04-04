# sarah.tn — Personal Website

A multi-tier personal website built with Astro (public site), React (Admin PWA),
ASP.NET Core 10 (API, Clean Architecture), and Strapi (CMS). Hosted on Azure.

## Quick Start

See [`specs/main/quickstart.md`](specs/main/quickstart.md) for full local dev setup.

```powershell
# 1. Start local services (SQL Server + Strapi)
docker-compose up -d

# 2. Public site  →  http://localhost:4321
cd src/site && npm install && npm run dev

# 3. Admin PWA    →  http://localhost:5173
cd src/admin && npm install && npm run dev

# 4. .NET API     →  http://localhost:5000
cd src/api && dotnet run --project PersonalSite.Api
```

## Project Structure

```
src/site/    Astro 4 public site
src/admin/   Admin PWA (React + Vite)
src/api/     ASP.NET Core 10 API (Clean Architecture)
cms/         Strapi v4 CMS
infra/       Azure IaC (PowerShell + az CLI)
specs/main/  Spec, plan, data model, contracts, tasks
```

## Key Docs

| Document | Path |
|----------|------|
| Constitution | `.specify/memory/constitution.md` |
| Full Spec | `specs/main/spec.md` |
| Implementation Plan | `specs/main/plan.md` |
| Task List | `specs/main/tasks.md` |
| Data Model | `specs/main/data-model.md` |
| API Contract | `specs/main/contracts/api.md` |
| Local Dev Guide | `specs/main/quickstart.md` |
