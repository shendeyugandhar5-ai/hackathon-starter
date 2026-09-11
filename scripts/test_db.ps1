# Quick Database Connectivity Tester
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Database Connectivity Health Check    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $rootDir "backend"
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "[FAIL] Virtual environment not found at $venvPython. Run scripts/run_backend.ps1 first." -ForegroundColor Red
    exit 1
}

Push-Location $backendDir
try {
    & $venvPython -c "from app.database.session import test_db_connectivity; from app.core.config import settings; print('[*] Testing database connectivity to: ' + settings.get_masked_database_target() + '...'); s = test_db_connectivity(); print('[OK] Database connected successfully in ' + str(s['latency_ms']) + 'ms') if s['connected'] else print('[FAIL] Database connection failed: ' + str(s['error']) + ' (' + str(s['latency_ms']) + 'ms)')"
} finally {
    Pop-Location
}
