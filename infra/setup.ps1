# infra/setup.ps1
# Idempotent Azure IaC script for konnichiwa-site.
# Run from repo root after dot-sourcing parameters.ps1:
#   . .\infra\parameters.ps1
#   . .\infra\setup.ps1
#
# Requirements: Azure CLI (az) — logged in via `az login`
# All resources use the $AppName prefix defined in parameters.ps1.
# Running this script multiple times is safe — resources that already exist are skipped.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Verify parameters file was sourced ──────────────────────────────────────
if (-not $SubscriptionId -or $SubscriptionId -eq "00000000-0000-0000-0000-000000000000") {
    Write-Error "Please dot-source infra/parameters.ps1 first: . .\infra\parameters.ps1"
    exit 1
}

Write-Host "=== konnichiwa-site Azure Provisioning ===" -ForegroundColor Cyan
Write-Host "Subscription : $SubscriptionId"
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Location      : $Location"
Write-Host "App Name      : $AppName"
Write-Host ""

# ─── Set active subscription ─────────────────────────────────────────────────
az account set --subscription $SubscriptionId
Write-Host "[1/9] Subscription set." -ForegroundColor Green

# ─── Resource Group ───────────────────────────────────────────────────────────
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "[2/9] Creating resource group: $ResourceGroup"
    az group create --name $ResourceGroup --location $Location | Out-Null
} else {
    Write-Host "[2/9] Resource group already exists: $ResourceGroup" -ForegroundColor Yellow
}

# ─── App Service Plan (B1 Linux — shared by .NET API + Strapi) ───────────────
$planName = "$AppName-plan"
$planExists = az appservice plan show --name $planName --resource-group $ResourceGroup 2>$null
if (-not $planExists) {
    Write-Host "[3/9] Creating App Service Plan: $planName (B1 Linux)"
    az appservice plan create `
        --name $planName `
        --resource-group $ResourceGroup `
        --sku $AppServicePlanSku `
        --is-linux | Out-Null
} else {
    Write-Host "[3/9] App Service Plan already exists: $planName" -ForegroundColor Yellow
}

# ─── .NET API App Service ─────────────────────────────────────────────────────
$apiAppName = "$AppName-api"
$apiExists = az webapp show --name $apiAppName --resource-group $ResourceGroup 2>$null
if (-not $apiExists) {
    Write-Host "[4/9] Creating .NET API App Service: $apiAppName"
    az webapp create `
        --name $apiAppName `
        --resource-group $ResourceGroup `
        --plan $planName `
        --runtime "DOTNETCORE:10.0" | Out-Null
} else {
    Write-Host "[4/9] .NET API App Service already exists: $apiAppName" -ForegroundColor Yellow
}

# ─── Strapi App Service ────────────────────────────────────────────────────────
$cmsAppName = "$AppName-cms"
$cmsExists = az webapp show --name $cmsAppName --resource-group $ResourceGroup 2>$null
if (-not $cmsExists) {
    Write-Host "[5/9] Creating Strapi App Service: $cmsAppName"
    az webapp create `
        --name $cmsAppName `
        --resource-group $ResourceGroup `
        --plan $planName `
        --runtime "NODE:20-lts" | Out-Null
} else {
    Write-Host "[5/9] Strapi App Service already exists: $cmsAppName" -ForegroundColor Yellow
}

# ─── Azure SQL Server + Database ─────────────────────────────────────────────
$sqlServerName = "$AppName-sql"
$sqlDbName     = "${AppName}db"
$sqlExists = az sql server show --name $sqlServerName --resource-group $ResourceGroup 2>$null
if (-not $sqlExists) {
    Write-Host "[6/9] Creating Azure SQL Server: $sqlServerName"
    az sql server create `
        --name $sqlServerName `
        --resource-group $ResourceGroup `
        --location $Location `
        --admin-user $SqlAdminLogin `
        --admin-password $SqlAdminPassword | Out-Null

    # Allow Azure services to connect
    az sql server firewall-rule create `
        --resource-group $ResourceGroup `
        --server $sqlServerName `
        --name AllowAzureServices `
        --start-ip-address 0.0.0.0 `
        --end-ip-address 0.0.0.0 | Out-Null

    Write-Host "[6/9] Creating Azure SQL Database: $sqlDbName ($SqlDatabaseSku)"
    az sql db create `
        --resource-group $ResourceGroup `
        --server $sqlServerName `
        --name $sqlDbName `
        --edition Basic `
        --capacity 5 | Out-Null
} else {
    Write-Host "[6/9] Azure SQL Server already exists: $sqlServerName" -ForegroundColor Yellow
}

# ─── Azure Blob Storage ───────────────────────────────────────────────────────
$storageExists = az storage account show --name $StorageAccountName --resource-group $ResourceGroup 2>$null
if (-not $storageExists) {
    Write-Host "[7/9] Creating Storage Account: $StorageAccountName"
    az storage account create `
        --name $StorageAccountName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Standard_LRS `
        --kind StorageV2 | Out-Null

    az storage container create `
        --name $StorageContainerMedia `
        --account-name $StorageAccountName `
        --public-access blob | Out-Null
} else {
    Write-Host "[7/9] Storage Account already exists: $StorageAccountName" -ForegroundColor Yellow
}

# ─── Azure Communication Services ────────────────────────────────────────────
$acsExists = az communication show --name $AcsName --resource-group $ResourceGroup 2>$null
if (-not $acsExists) {
    Write-Host "[8/9] Creating Azure Communication Services: $AcsName"
    az communication create `
        --name $AcsName `
        --resource-group $ResourceGroup `
        --location "global" `
        --data-location "Europe" | Out-Null
} else {
    Write-Host "[8/9] ACS already exists: $AcsName" -ForegroundColor Yellow
}

# ─── Azure Static Web Apps (public site + Admin PWA) ─────────────────────────
$swaPublicExists = az staticwebapp show --name $SwaPublicSiteName --resource-group $ResourceGroup 2>$null
if (-not $swaPublicExists) {
    Write-Host "[9/9] Creating Static Web App (public site): $SwaPublicSiteName"
    az staticwebapp create `
        --name $SwaPublicSiteName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Free | Out-Null
} else {
    Write-Host "[9/9] Static Web App already exists: $SwaPublicSiteName" -ForegroundColor Yellow
}

$swaAdminExists = az staticwebapp show --name $SwaAdminPwaName --resource-group $ResourceGroup 2>$null
if (-not $swaAdminExists) {
    Write-Host "[9/9] Creating Static Web App (Admin PWA): $SwaAdminPwaName"
    az staticwebapp create `
        --name $SwaAdminPwaName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Free | Out-Null
} else {
    Write-Host "[9/9] Static Web App (Admin PWA) already exists: $SwaAdminPwaName" -ForegroundColor Yellow
}

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Provisioning complete ===" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  1. Configure App Settings on $apiAppName (connection strings, JWT, ACS keys)"
Write-Host "  2. Run EF Core migrations: cd src/api && dotnet ef database update --project PersonalSite.Infrastructure --startup-project PersonalSite.Api"
Write-Host "  3. Deploy via GitHub Actions or az webapp deploy"
Write-Host ""
Write-Host "Cost estimate: ~€25-30/month (B1 plan + Basic SQL + Storage + ACS)"
Write-Host "Budget gate  : ≤€30/month (spec §7.1)"
