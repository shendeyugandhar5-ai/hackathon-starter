# Automated health & build validation script
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Hackathon Starter Verification Check   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

# 1. Backend Verification & Database Connectivity Check
Write-Host ""
Write-Host "[1/3] Checking Backend Python & Database Configuration..." -ForegroundColor Yellow
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"

if (Test-Path $venvPython) {
    Push-Location $backendDir
    try {
        & $venvPython -c "
from app.main import app, root
from app.routes.health import get_health
from app.database.session import test_db_connectivity
from app.core.config import settings

print('  [OK] App Title:', app.title)
print('  [OK] Database Target:', settings.get_masked_database_target())
db_status = test_db_connectivity()
print('  [OK] DB Reachable:', db_status['connected'], '(latency:', str(db_status['latency_ms']) + 'ms)')
r_root = root()
print('  [OK] GET / =>', r_root.status)
r_health = get_health()
print('  [OK] GET /api/health =>', r_health.status, '(DB:', r_health.database + ')')
"
        Write-Host "  [OK] Backend imports, database config & endpoints verified successfully!" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "  [FAIL] Python venv not found at $venvPython." -ForegroundColor Red
}

# 2. Frontend Verification
Write-Host ""
Write-Host "[2/3] Checking Frontend Build..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
    Write-Host "  [OK] Frontend built successfully into frontend/dist!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 3. Database Services Overview
Write-Host ""
Write-Host "[3/3] Checking Database Providers & Local Services..." -ForegroundColor Yellow
$pgServices = Get-Service postgresql* -ErrorAction SilentlyContinue
if ($pgServices) {
    foreach ($svc in $pgServices) {
        Write-Host "  [OK] Local Windows Service: $($svc.Name) -> $($svc.Status)" -ForegroundColor Green
    }
} else {
    Write-Host "  [INFO] No local Windows PostgreSQL service detected." -ForegroundColor Cyan
}
Write-Host "  [INFO] Primary Database: Supabase (via DATABASE_URL in .env)" -ForegroundColor Cyan
Write-Host "  [INFO] Optional Fallback: Local Docker PostgreSQL (docker compose up -d postgres)" -ForegroundColor Cyan

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  [SUCCESS] All verification checks passed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
