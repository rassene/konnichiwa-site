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
Write-Host "[1/13] Subscription set." -ForegroundColor Green

# ─── Resource Group ───────────────────────────────────────────────────────────
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "[2/13] Creating resource group: $ResourceGroup"
    az group create --name $ResourceGroup --location $Location | Out-Null
} else {
    Write-Host "[2/13] Resource group already exists: $ResourceGroup" -ForegroundColor Yellow
}

# ─── App Service Plan (B1 Linux — shared by .NET API + Strapi) ───────────────
$planName = "$AppName-plan"
$planExists = az appservice plan show --name $planName --resource-group $ResourceGroup 2>$null
if (-not $planExists) {
    Write-Host "[3/13] Creating App Service Plan: $planName (B1 Linux)"
    az appservice plan create `
        --name $planName `
        --resource-group $ResourceGroup `
        --sku $AppServicePlanSku `
        --is-linux | Out-Null
} else {
    Write-Host "[3/13] App Service Plan already exists: $planName" -ForegroundColor Yellow
}

# ─── .NET API App Service ─────────────────────────────────────────────────────
$apiAppName = "$AppName-api"
$apiExists = az webapp show --name $apiAppName --resource-group $ResourceGroup 2>$null
if (-not $apiExists) {
    Write-Host "[4/13] Creating .NET API App Service: $apiAppName"
    az webapp create `
        --name $apiAppName `
        --resource-group $ResourceGroup `
        --plan $planName `
        --runtime "DOTNETCORE:10.0" | Out-Null
} else {
    Write-Host "[4/13] .NET API App Service already exists: $apiAppName" -ForegroundColor Yellow
}

# ─── Strapi App Service ────────────────────────────────────────────────────────
$cmsAppName = "$AppName-cms"
$cmsExists = az webapp show --name $cmsAppName --resource-group $ResourceGroup 2>$null
if (-not $cmsExists) {
    Write-Host "[5/13] Creating Strapi App Service: $cmsAppName"
    az webapp create `
        --name $cmsAppName `
        --resource-group $ResourceGroup `
        --plan $planName `
        --runtime "NODE:20-lts" | Out-Null
} else {
    Write-Host "[5/13] Strapi App Service already exists: $cmsAppName" -ForegroundColor Yellow
}

# ─── Azure SQL Server + Database ─────────────────────────────────────────────
$sqlServerName = "$AppName-sql"
$sqlDbName     = "${AppName}db"
$sqlExists = az sql server show --name $sqlServerName --resource-group $ResourceGroup 2>$null
if (-not $sqlExists) {
    Write-Host "[6/13] Creating Azure SQL Server: $sqlServerName"
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

    Write-Host "[6/13] Creating Azure SQL Database: $sqlDbName ($SqlDatabaseSku)"
    az sql db create `
        --resource-group $ResourceGroup `
        --server $sqlServerName `
        --name $sqlDbName `
        --edition Basic `
        --capacity 5 | Out-Null
} else {
    Write-Host "[6/13] Azure SQL Server already exists: $sqlServerName" -ForegroundColor Yellow
}

# ─── Azure Blob Storage ───────────────────────────────────────────────────────
$storageExists = az storage account show --name $StorageAccountName --resource-group $ResourceGroup 2>$null
if (-not $storageExists) {
    Write-Host "[7/13] Creating Storage Account: $StorageAccountName"
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
    Write-Host "[7/13] Storage Account already exists: $StorageAccountName" -ForegroundColor Yellow
}

# ─── Azure Communication Services ────────────────────────────────────────────
$acsExists = az communication show --name $AcsName --resource-group $ResourceGroup 2>$null
if (-not $acsExists) {
    Write-Host "[8/13] Creating Azure Communication Services: $AcsName"
    az communication create `
        --name $AcsName `
        --resource-group $ResourceGroup `
        --location "global" `
        --data-location "Europe" | Out-Null
} else {
    Write-Host "[8/13] ACS already exists: $AcsName" -ForegroundColor Yellow
}

# ─── Azure Static Web Apps (public site + Admin PWA) ─────────────────────────
$swaPublicExists = az staticwebapp show --name $SwaPublicSiteName --resource-group $ResourceGroup 2>$null
if (-not $swaPublicExists) {
    Write-Host "[9/13] Creating Static Web App (public site): $SwaPublicSiteName"
    az staticwebapp create `
        --name $SwaPublicSiteName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Free | Out-Null
} else {
    Write-Host "[9/13] Static Web App already exists: $SwaPublicSiteName" -ForegroundColor Yellow
}

$swaAdminExists = az staticwebapp show --name $SwaAdminPwaName --resource-group $ResourceGroup 2>$null
if (-not $swaAdminExists) {
    Write-Host "[9/13] Creating Static Web App (Admin PWA): $SwaAdminPwaName"
    az staticwebapp create `
        --name $SwaAdminPwaName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Free | Out-Null
} else {
    Write-Host "[9/13] Static Web App (Admin PWA) already exists: $SwaAdminPwaName" -ForegroundColor Yellow
}

# ─── Azure SignalR Service (Free_F1) ─────────────────────────────────────────
$signalRExists = az signalr show --name $SignalRName --resource-group $ResourceGroup 2>$null
if (-not $signalRExists) {
    Write-Host "[10/13] Creating Azure SignalR Service: $SignalRName (Free_F1)"
    az signalr create `
        --name $SignalRName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku $SignalRSku `
        --service-mode Default | Out-Null
} else {
    Write-Host "[10/13] SignalR Service already exists: $SignalRName" -ForegroundColor Yellow
}

# ─── Azure Key Vault ──────────────────────────────────────────────────────────
$kvExists = az keyvault show --name $KeyVaultName --resource-group $ResourceGroup 2>$null
if (-not $kvExists) {
    Write-Host "[11/13] Creating Azure Key Vault: $KeyVaultName"
    az keyvault create `
        --name $KeyVaultName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku standard `
        --enable-soft-delete true `
        --retention-days 7 | Out-Null
} else {
    Write-Host "[11/13] Key Vault already exists: $KeyVaultName" -ForegroundColor Yellow
}

# Grant the .NET API App Service a managed identity and Key Vault access
$apiPrincipalId = az webapp identity assign `
    --name $apiAppName `
    --resource-group $ResourceGroup `
    --query principalId -o tsv 2>$null

if ($apiPrincipalId) {
    az keyvault set-policy `
        --name $KeyVaultName `
        --object-id $apiPrincipalId `
        --secret-permissions get list | Out-Null
    Write-Host "       Key Vault access granted to $apiAppName (managed identity)" -ForegroundColor Cyan
}

# ─── Microsoft CDN (Azure CDN Profile + Endpoint for Blob Storage) ────────────
$cdnProfileName   = "$AppName-cdn"
$cdnEndpointName  = "$AppName-media"
$storageOrigin    = "${StorageAccountName}.blob.core.windows.net"

$cdnProfileExists = az cdn profile show --name $cdnProfileName --resource-group $ResourceGroup 2>$null
if (-not $cdnProfileExists) {
    Write-Host "[12/13] Creating Azure CDN Profile: $cdnProfileName (Standard_Microsoft)"
    az cdn profile create `
        --name $cdnProfileName `
        --resource-group $ResourceGroup `
        --location "global" `
        --sku Standard_Microsoft | Out-Null

    Write-Host "[12/13] Creating CDN Endpoint: $cdnEndpointName → $storageOrigin"
    az cdn endpoint create `
        --name $cdnEndpointName `
        --profile-name $cdnProfileName `
        --resource-group $ResourceGroup `
        --origin $storageOrigin `
        --origin-host-header $storageOrigin `
        --enable-compression true | Out-Null
} else {
    Write-Host "[12/13] CDN Profile already exists: $cdnProfileName" -ForegroundColor Yellow
}

# ─── Application Insights ─────────────────────────────────────────────────────
$appInsightsName = "$AppName-insights"
$aiExists = az monitor app-insights component show `
    --app $appInsightsName `
    --resource-group $ResourceGroup 2>$null
if (-not $aiExists) {
    Write-Host "[13/13] Creating Application Insights: $appInsightsName"
    az monitor app-insights component create `
        --app $appInsightsName `
        --location $Location `
        --resource-group $ResourceGroup `
        --application-type web | Out-Null
} else {
    Write-Host "[13/13] Application Insights already exists: $appInsightsName" -ForegroundColor Yellow
}

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Provisioning complete ===" -ForegroundColor Green
Write-Host "Cost estimate: ~€25-30/month (B1 plan + Basic SQL + Storage + ACS)"
Write-Host "Budget gate  : ≤€30/month (spec §7.1)"
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  MANUAL STEPS — complete before deploying            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "[ ] 1. DNS — point $CustomDomain to Static Web Apps CNAME"
Write-Host "         az staticwebapp hostname set --name $SwaPublicSiteName --hostname $CustomDomain"
Write-Host "[ ] 2. DNS — point $ApiSubdomain to $apiAppName.azurewebsites.net"
Write-Host "[ ] 3. DNS — point $AdminSubdomain to $SwaAdminPwaName CNAME"
Write-Host ""
Write-Host "[ ] 4. GitHub Secrets — add the following in repo Settings > Secrets:"
Write-Host "         AZURE_STATIC_WEB_APPS_API_TOKEN_SITE  (from: $SwaPublicSiteName > Manage deployment token)"
Write-Host "         AZURE_STATIC_WEB_APPS_API_TOKEN_ADMIN (from: $SwaAdminPwaName > Manage deployment token)"
Write-Host "         AZURE_WEBAPP_PUBLISH_PROFILE          (from: $apiAppName > Get publish profile)"
Write-Host "         STRAPI_URL                            (e.g. https://$cmsAppName.azurewebsites.net)"
Write-Host "         STRAPI_API_TOKEN                      (from Strapi Admin > Settings > API Tokens)"
Write-Host "         LHCI_GITHUB_APP_TOKEN                 (from https://github.com/apps/lighthouse-ci)"
Write-Host ""
Write-Host "[ ] 5. GitHub Variables — add the following in repo Settings > Variables:"
Write-Host "         PUBLIC_API_URL  = https://$ApiSubdomain"
Write-Host "         VITE_API_URL    = https://$ApiSubdomain"
Write-Host "         AZURE_API_APP_NAME = $apiAppName"
Write-Host ""
Write-Host "[ ] 6. Key Vault secrets — store production values:"
Write-Host "         az keyvault secret set --vault-name $KeyVaultName --name SqlPassword --value '<password>'"
Write-Host "         az keyvault secret set --vault-name $KeyVaultName --name JwtKey --value '<32+ char key>'"
Write-Host "         az keyvault secret set --vault-name $KeyVaultName --name VapidPrivateKey --value '<VAPID private key>'"
Write-Host ""
Write-Host "[ ] 7. App Service config — run migrations against production SQL:"
Write-Host "         dotnet ef database update --project src/api/PersonalSite.Infrastructure --startup-project src/api/PersonalSite.Api"
Write-Host ""
Write-Host "[ ] 8. Verify all four deployments via GitHub Actions after pushing to main"
Write-Host ""
Write-Host "[ ] 9. VAPID key generation (one-time):"
Write-Host "         npx web-push generate-vapid-keys"
Write-Host "         Store public key in Admin PWA env, private key in Key Vault"
Write-Host ""
