$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot 'water-crm-ia'
$backend = Join-Path $root 'backend-laravel'
$simulator = Join-Path $root 'whatsapp-simulator'

function Test-Port($port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

if (-not (Test-Port 8000)) {
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$backend'; php artisan serve --host=127.0.0.1 --port=8000" -WindowStyle Normal
}

if (-not (Test-Port 3001)) {
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$simulator'; node server.js" -WindowStyle Normal
}

if (-not (Test-Port 5173)) {
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$simulator'; npm run dev" -WindowStyle Normal
}

Write-Host ''
Write-Host 'Water CRM IA iniciado:' -ForegroundColor Green
Write-Host '  Frontend:  http://127.0.0.1:5173'
Write-Host '  Simulador: http://127.0.0.1:3001'
Write-Host '  Laravel:   http://127.0.0.1:8000'
Write-Host ''
Write-Host 'Nota: el webhook requiere que MySQL acepte el usuario laravel.' -ForegroundColor Yellow
