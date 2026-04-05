# Azure Setup Guide — konnichiwa-site

Complete deployment setup guide. Follow each numbered step in order.

---

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and logged in (`az login`)
- [Node.js 20+](https://nodejs.org/) and [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [GitHub CLI](https://cli.github.com/) (optional, for setting secrets via CLI)
- An Azure subscription with at least €30/month budget available

---

## Step 1 — Clone and configure parameters

```powershell
# 1a. Copy the parameters template
Copy-Item infra/parameters.example.ps1 infra/parameters.ps1

# 1b. Edit parameters.ps1 — fill in your real values:
#     $SubscriptionId  — from: az account show --query id -o tsv
#     $AppName         — short lowercase prefix (e.g. "sarah")
#     $SqlAdminPassword — a strong password (≥12 chars, mixed case + numbers + symbols)
#     $StorageAccountName — globally unique, 3-24 chars, lowercase only
notepad infra/parameters.ps1
```

> **Security**: `parameters.ps1` is gitignored — never commit it.

---

## Step 2 — Provision Azure resources

```powershell
# Dot-source parameters, then run the idempotent provisioning script
. .\infra\parameters.ps1
. .\infra\setup.ps1
```

The script creates (idempotent — safe to re-run):

| # | Resource | SKU / Tier |
|---|----------|-----------|
| 2 | Resource Group | — |
| 3 | App Service Plan | B1 Linux (shared) |
| 4 | .NET API App Service | DOTNETCORE:10.0 |
| 5 | Strapi CMS App Service | NODE:20-lts |
| 6 | Azure SQL Server + Database | Basic 5 DTU |
| 7 | Blob Storage Account | Standard LRS Hot |
| 8 | Azure Communication Services | — |
| 9 | Static Web App — public site | Free |
| 9 | Static Web App — admin PWA | Free |
| 10 | Azure SignalR Service | Free_F1 |
| 11 | Azure Key Vault | Standard |
| 12 | Azure CDN Profile + Endpoint | Standard_Microsoft |
| 13 | Application Insights | Web |

**Estimated cost**: ~€25–30/month (budget gate: ≤€30/month).

---

## Step 3 — DNS configuration

Point your domain's DNS records to the provisioned Azure resources. These are manual
steps in your DNS registrar's control panel.

| Record | Type | Value |
|--------|------|-------|
| `@` (root) | CNAME | `<your-site>.azurestaticapps.net` |
| `admin` | CNAME | `<your-admin-pwa>.azurestaticapps.net` |
| `api` | CNAME | `<your-api-app>.azurewebsites.net` |

After DNS propagates, add the custom domains to Azure:

```bash
# Public site
az staticwebapp hostname set \
  --name <SwaPublicSiteName> \
  --hostname <CustomDomain>

# Admin PWA
az staticwebapp hostname set \
  --name <SwaAdminPwaName> \
  --hostname <AdminSubdomain>

# .NET API (requires custom domain + SSL binding in App Service)
az webapp config hostname add \
  --webapp-name <apiAppName> \
  --resource-group <ResourceGroup> \
  --hostname <ApiSubdomain>
```

---

## Step 4 — GitHub repository secrets

Go to **GitHub → repo → Settings → Secrets and variables → Actions** and add:

### Secrets (encrypted)

| Secret name | How to get the value |
|-------------|---------------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_SITE` | Azure Portal → Static Web Apps → public site → Manage deployment token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN` | Azure Portal → Static Web Apps → admin PWA → Manage deployment token |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Azure Portal → App Service (API) → Overview → Get publish profile — paste the full XML |
| `STRAPI_URL` | `https://<cmsAppName>.azurewebsites.net` |
| `STRAPI_API_TOKEN` | Strapi Admin UI → Settings → API Tokens → Create |
| `LHCI_GITHUB_APP_TOKEN` | Install the [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci) and copy the token |

### Variables (plain text)

Go to **Settings → Secrets and variables → Actions → Variables tab**:

| Variable name | Value |
|---------------|-------|
| `PUBLIC_API_URL` | `https://<ApiSubdomain>` (e.g. `https://api.sarah.tn`) |
| `VITE_API_URL` | same as `PUBLIC_API_URL` |
| `AZURE_API_APP_NAME` | The App Service name (e.g. `sarah-api`) |

---

## Step 5 — Azure Key Vault secrets

Store production credentials in Key Vault (the API reads these via managed identity):

```bash
# SQL admin password
az keyvault secret set \
  --vault-name <KeyVaultName> \
  --name SqlPassword \
  --value "<your-sql-admin-password>"

# JWT signing key (32+ characters, random)
az keyvault secret set \
  --vault-name <KeyVaultName> \
  --name JwtKey \
  --value "<random-32-char-key>"

# VAPID keys for push notifications (generate once)
npx web-push generate-vapid-keys
# → outputs PublicKey + PrivateKey

az keyvault secret set \
  --vault-name <KeyVaultName> \
  --name VapidPublicKey \
  --value "<vapid-public-key>"

az keyvault secret set \
  --vault-name <KeyVaultName> \
  --name VapidPrivateKey \
  --value "<vapid-private-key>"

# ACS connection string
# Azure Portal → Communication Services → Keys → Connection string
az keyvault secret set \
  --vault-name <KeyVaultName> \
  --name AcsConnectionString \
  --value "<acs-connection-string>"
```

Then configure the .NET API App Service to read from Key Vault:

```bash
az webapp config appsettings set \
  --name <apiAppName> \
  --resource-group <ResourceGroup> \
  --settings \
    "ConnectionStrings__DefaultConnection=Server=<sqlServerName>.database.windows.net;Database=<sqlDbName>;User Id=<SqlAdminLogin>;Password=<SqlAdminPassword>;Encrypt=True" \
    "Jwt__Issuer=https://<ApiSubdomain>" \
    "Jwt__Audience=https://<ApiSubdomain>" \
    "Acs__SenderAddress=no-reply@<CustomDomain>" \
    "Acs__OwnerAddress=<your-email>"
```

---

## Step 6 — Run EF Core migrations (production)

```bash
cd src/api

# Update the production database (run from local machine with VPN or via Azure Cloud Shell)
dotnet ef database update \
  --project PersonalSite.Infrastructure \
  --startup-project PersonalSite.Api \
  --connection "Server=<sqlServerName>.database.windows.net;Database=<sqlDbName>;User Id=<SqlAdminLogin>;Password=<SqlAdminPassword>;Encrypt=True"
```

---

## Step 7 — First deployment

Push to `main` to trigger all four GitHub Actions workflows:

```bash
git push origin main
```

Monitor in **GitHub → Actions**:
- `Deploy — Public Site` → deploys Astro to SWA
- `Deploy — Admin PWA` → deploys React SPA to SWA
- `Deploy — .NET API` → builds, tests, and deploys to App Service
- `CI — Build & Lint` → runs on every PR and push to `main`

---

## Step 8 — Post-deployment verification checklist

Run through these checks after the first successful deployment:

- [ ] Public site loads at `https://<CustomDomain>` — all 7 shell sections visible
- [ ] Life Map and Family sections load at `/life-map` and `/family`
- [ ] Contact form at `/reach-out` — submit a test message, verify email arrives
- [ ] Newsletter subscribe flow — subscribe with a test email, confirm, check gated content
- [ ] Admin PWA loads at `https://<AdminSubdomain>` — login with owner credentials
- [ ] Admin dashboard shows visitor count updating in real time
- [ ] Push notification appears on new contact submission
- [ ] Lighthouse CI workflow passes (Performance ≥ 90, Accessibility ≥ 95)
- [ ] Application Insights telemetry visible in Azure Portal
- [ ] CDN endpoint serves media from `https://<cdnEndpointName>.azureedge.net/<StorageContainerMedia>/`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Strapi fails to start on App Service | Check `/home` volume is mounted (App Service persistent storage setting) |
| EF migrations fail | Verify SQL firewall allows your deployment agent's IP |
| JWT auth 401 in production | Confirm `Jwt__Issuer` and `Jwt__Audience` match the deployed API URL |
| Push notifications not delivered | Verify VAPID keys in Key Vault match those in Admin PWA env |
| SignalR connection drops | SignalR Free tier limit: 20 concurrent connections, 20k messages/day |
| Build fails: Strapi unreachable | Strapi must be running for `astro build` — use placeholder URL in CI env |
