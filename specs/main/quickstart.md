# Quickstart: Local Development

**Branch**: `main` | **Date**: 2026-04-04 | **Plan**: [plan.md](plan.md)

This guide sets up the full local development environment on Windows. All commands
use PowerShell unless noted. VS Code is the canonical editor.

---

## Prerequisites

Install all tools via `winget` (run PowerShell as Administrator):

```powershell
winget install OpenJS.NodeJS.LTS         # Node.js LTS (Astro, Strapi, Admin PWA)
winget install Microsoft.DotNet.SDK.8    # .NET 8 SDK
winget install Microsoft.AzureCLI        # Azure CLI
winget install Git.Git
winget install Microsoft.VisualStudioCode
winget install Docker.DockerDesktop      # Local SQL Server + Strapi
winget install GitHub.GitHubCLI          # Optional but useful
```

Verify after install:

```powershell
node --version       # v20+
dotnet --version     # 8.x
az --version
docker --version
```

---

## 1. Clone & Open

```powershell
git clone https://github.com/<owner>/<repo>.git konnichiwa-site
cd konnichiwa-site
code .  # opens VS Code — install recommended extensions when prompted
```

---

## 2. Copy Environment Config

```powershell
# API secrets
Copy-Item src/api/PersonalSite.Api/appsettings.Development.example.json `
          src/api/PersonalSite.Api/appsettings.Development.json
# Edit appsettings.Development.json with local values (see comments in the file)

# Infra parameters (if running setup.ps1)
Copy-Item infra/parameters.example.ps1 infra/parameters.ps1
# Edit infra/parameters.ps1 with your Azure subscription details
```

---

## 3. Start Docker Services

Docker Desktop must be running.

```powershell
# From repo root
docker-compose up -d
```

This starts:
- **SQL Server** on `localhost:1433` (sa password in docker-compose.yml)
- **Strapi** on `http://localhost:1337` (uses SQLite, data persisted in Docker volume)

Wait ~30 seconds for Strapi to initialize on first run.

---

## 4. Run .NET API Migrations

```powershell
cd src/api
dotnet restore
dotnet ef database update --project PersonalSite.Infrastructure `
                           --startup-project PersonalSite.Api
```

This creates all tables in the local SQL Server instance.

---

## 5. Start the .NET API

```powershell
# From src/api/
dotnet run --project PersonalSite.Api
# API available at http://localhost:5000
# Swagger UI at http://localhost:5000/swagger (Development only)
```

---

## 6. Configure Strapi Content Types

Open `http://localhost:1337/admin` and create the first admin account.

Import content type definitions (if scaffold script exists):

```powershell
# From cms/
npm install
npm run strapi -- ts:generate-types  # generates TypeScript types from Strapi schema
```

Content types must match the CAL interfaces defined in `data-model.md`. Set them up
via the Strapi Content-Type Builder UI or import from `cms/src/api/` schema files
(committed to the repo after initial setup).

---

## 7. Start the Public Site

```powershell
cd src/site
npm install
npm run dev
# Public site at http://localhost:4321
```

The site reads content from Strapi at `http://localhost:1337`. Ensure `STRAPI_URL` is
set in `src/site/.env` (copy from `src/site/.env.example`).

---

## 8. Start the Admin PWA (Optional)

```powershell
cd src/admin
npm install
npm run dev
# Admin PWA at http://localhost:5173
```

Set `VITE_API_URL=http://localhost:5000` in `src/admin/.env`.

---

## Verification Checklist

- [ ] `http://localhost:4321` loads the Home section
- [ ] `http://localhost:4321/projects` loads (empty grid is acceptable before content added)
- [ ] `http://localhost:5000/swagger` shows all API endpoints
- [ ] `http://localhost:1337/admin` Strapi admin panel accessible
- [ ] `http://localhost:5173` Admin PWA loads (login page shown)

---

## Useful Commands

```powershell
# Run all .NET tests
cd src/api && dotnet test

# Run frontend tests
cd src/site && npm run test

# Run Lighthouse CI locally
cd src/site && npm run build && npx lhci autorun

# Add a new EF Core migration
cd src/api
dotnet ef migrations add <MigrationName> --project PersonalSite.Infrastructure `
                                          --startup-project PersonalSite.Api

# Stop all Docker services
docker-compose down

# Wipe Docker volumes (reset DB + Strapi data)
docker-compose down -v
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Strapi not starting | Node version too old | Ensure Node LTS (v20+) |
| SQL Server connection refused | Docker not running | `docker-compose up -d` |
| EF migration fails | Wrong connection string | Check `appsettings.Development.json` |
| Astro build errors | Missing env vars | Copy `.env.example` → `.env` in `src/site/` |
| CAL returning empty arrays | Strapi not seeded | Add at least one content entry per type in Strapi admin |
