$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $scriptDir 'server'
$clientDir = Join-Path $scriptDir 'client'

$cloudflaredCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
$cloudflaredExe = if ($cloudflaredCommand) {
  $cloudflaredCommand.Source
} else {
  Join-Path ${env:ProgramFiles(x86)} 'cloudflared\cloudflared.exe'
}

if (-not (Test-Path $cloudflaredExe)) {
  Write-Host 'cloudflared nao encontrado no PATH nem no local padrao.' -ForegroundColor Red
  Write-Host 'Instale com: winget install --id Cloudflare.cloudflared -e' -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $serverDir)) {
  Write-Host "Pasta nao encontrada: $serverDir" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $clientDir)) {
  Write-Host "Pasta nao encontrada: $clientDir" -ForegroundColor Red
  exit 1
}

Write-Host 'Subindo backend em nova janela...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location -LiteralPath '$serverDir'; npm run qrcode:generate; npm start"
)

Start-Sleep -Seconds 2

Write-Host 'Subindo frontend em nova janela...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location -LiteralPath '$clientDir'; npm run dev"
)

Write-Host ''
Write-Host 'Aguardando frontend inicializar...' -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host ''
Write-Host 'Iniciando tunnel HTTPS para http://localhost:5173' -ForegroundColor Green
Write-Host 'Use no celular a URL https://***.trycloudflare.com exibida abaixo.' -ForegroundColor Green
Write-Host 'Pressione Ctrl+C para encerrar o tunnel.' -ForegroundColor Yellow
Write-Host ''

Set-Location -LiteralPath $scriptDir
& $cloudflaredExe tunnel --url http://localhost:5173 --no-autoupdate
