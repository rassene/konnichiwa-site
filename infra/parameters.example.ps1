# infra/parameters.example.ps1
# Copy this file to parameters.ps1 and fill in your values.
# parameters.ps1 is gitignored — never commit real values.
#
# Usage:
#   . .\infra\parameters.ps1   # dot-source before running setup.ps1
#   . .\infra\setup.ps1

# ── Azure Subscription ──────────────────────────────────────────────────────
$SubscriptionId = "00000000-0000-0000-0000-000000000000"  # az account show --query id -o tsv
$Location       = "westeurope"                             # az account list-locations -o table

# ── Resource naming ─────────────────────────────────────────────────────────
$AppName        = "sarah"          # Used as prefix: sarah-api, sarah-cms, sarah-plan, etc.
$ResourceGroup  = "$AppName-rg"
$Environment    = "prod"           # dev | staging | prod

# ── App Service Plan (shared: API + Strapi) ──────────────────────────────────
# SKU: B1 = Basic, 1 core, 1.75 GB RAM. Lowest tier with Always-On + custom domain.
$AppServicePlanSku = "B1"

# ── Azure SQL Database ───────────────────────────────────────────────────────
# SKU: Basic = 5 DTU. Sufficient for personal site scale.
$SqlAdminLogin    = "sqladmin"
$SqlAdminPassword = "CHANGE_ME_STRONG_PASSWORD"   # Store in Key Vault after first run
$SqlDatabaseSku   = "Basic"

# ── Azure Blob Storage ───────────────────────────────────────────────────────
$StorageAccountName = "${AppName}storage"   # Must be globally unique, 3-24 chars, lowercase
$StorageContainerMedia = "media"

# ── Azure Communication Services ─────────────────────────────────────────────
$AcsName           = "$AppName-acs"
$AcsFromEmail      = "no-reply@sarah.tn"   # Must be a verified domain in ACS

# ── Azure SignalR Service ────────────────────────────────────────────────────
$SignalRName = "$AppName-signalr"
$SignalRSku  = "Free_F1"   # Free tier: 20 concurrent connections, 20k messages/day

# ── Azure Key Vault ───────────────────────────────────────────────────────────
$KeyVaultName = "$AppName-kv"   # Must be globally unique, 3-24 chars

# ── Azure Static Web Apps ────────────────────────────────────────────────────
$SwaPublicSiteName = "$AppName-site"
$SwaAdminPwaName   = "$AppName-admin"

# ── Domain ───────────────────────────────────────────────────────────────────
$CustomDomain      = "sarah.tn"
$ApiSubdomain      = "api.sarah.tn"
$AdminSubdomain    = "admin.sarah.tn"

# ── GitHub (for CI/CD) ────────────────────────────────────────────────────────
# Set these as GitHub repository secrets (not in this file):
#   AZURE_STATIC_WEB_APPS_API_TOKEN_SITE   - from Azure Static Web Apps > Manage deployment token
#   AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN  - from Azure Static Web Apps > Manage deployment token
#   AZURE_WEBAPP_PUBLISH_PROFILE           - from Azure App Service > Get publish profile
#   AZURE_SUBSCRIPTION_ID                  - $SubscriptionId above
