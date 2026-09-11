# PowerShell helper to start React Vite frontend
$ErrorActionPreference = "Stop"

Write-Host "[*] Starting React + Vite Frontend..." -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "..\frontend"
Set-Location $frontendDir

if (-not (Test-Path ".\node_modules")) {
    Write-Host "[*] Installing node modules..." -ForegroundColor Yellow
    npm install
}

Write-Host "[*] Launching Vite dev server on http://localhost:5173..." -ForegroundColor Green
npm run dev
