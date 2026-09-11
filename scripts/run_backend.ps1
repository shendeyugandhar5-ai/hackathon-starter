# PowerShell helper to start FastAPI backend
$ErrorActionPreference = "Stop"

Write-Host "[*] Starting FastAPI Backend..." -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendDir

# Prefer the 'py' launcher - on many Windows machines 'python' resolves to the
# Microsoft Store alias stub, which doesn't actually run Python.
$pythonCmd = if (Get-Command py -ErrorAction SilentlyContinue) { "py" }
             elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" }
             else { $null }

if (-not $pythonCmd) {
    Write-Host "[FAIL] No Python installation found (tried 'py' and 'python')." -ForegroundColor Red
    Write-Host "       Install Python from python.org, or disable the Store alias at" -ForegroundColor Red
    Write-Host "       Settings > Apps > Advanced app settings > App execution aliases." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Host "[*] Creating Python virtual environment..." -ForegroundColor Yellow
    & $pythonCmd -m venv .venv
}

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Host "[FAIL] Virtual environment creation failed - .venv\Scripts\python.exe not found." -ForegroundColor Red
    exit 1
}

Write-Host "[*] Activating virtual environment & verifying dependencies..." -ForegroundColor Green
& ".\.venv\Scripts\Activate.ps1"
& ".\.venv\Scripts\pip.exe" install -r requirements.txt -q

Write-Host "[*] Launching Uvicorn server on http://localhost:8000 (Swagger: http://localhost:8000/docs)..." -ForegroundColor Cyan
& ".\.venv\Scripts\uvicorn.exe" app.main:app --reload --host 0.0.0.0 --port 8000
