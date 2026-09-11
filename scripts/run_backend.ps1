# PowerShell helper to start FastAPI backend
$ErrorActionPreference = "Stop"

Write-Host "[*] Starting FastAPI Backend..." -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendDir

if (-not (Test-Path ".\.venv")) {
    Write-Host "[*] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

Write-Host "[*] Activating virtual environment & verifying dependencies..." -ForegroundColor Green
& ".\.venv\Scripts\Activate.ps1"
& ".\.venv\Scripts\pip.exe" install -r requirements.txt -q

Write-Host "[*] Launching Uvicorn server on http://localhost:8000 (Swagger: http://localhost:8000/docs)..." -ForegroundColor Cyan
& ".\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 0.0.0.0 --port 8000
