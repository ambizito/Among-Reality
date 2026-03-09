$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $scriptDir 'server'
$clientDir = Join-Path $scriptDir 'client'

function Show-TunnelQr {
  param(
    [Parameter(Mandatory = $true)]
    [string]$tunnelUrl
  )

  $qrPath = Join-Path $env:TEMP 'among-reality-tunnel-qr.png'

  try {
    Get-Command node -ErrorAction Stop | Out-Null
  } catch {
    Write-Host 'Aviso: node nao encontrado para gerar QR automatico.' -ForegroundColor Yellow
    Write-Host "Use o link manualmente: $tunnelUrl" -ForegroundColor Yellow
    return
  }

  try {
    $nodeScript = @"
const QRCode = require('qrcode');
const outputPath = process.argv[2];
const tunnelUrl = process.argv[3];

QRCode.toFile(outputPath, tunnelUrl, {
  margin: 1,
  width: 512,
  errorCorrectionLevel: 'M',
})
  .then(() => {
    process.stdout.write('QR_OK');
  })
  .catch((error) => {
    console.error(error?.message || String(error));
    process.exit(1);
  });
"@
    Push-Location -LiteralPath $serverDir
    try {
      $nodeOutput = $nodeScript | node - "$qrPath" "$tunnelUrl" 2>&1
    } finally {
      Pop-Location
    }

    $nodeOutputText = ($nodeOutput | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
      if ($nodeOutputText -match "Cannot find module 'qrcode'") {
        throw "Modulo 'qrcode' nao encontrado em $serverDir\nRode: cd server && npm install"
      }
      throw "Falha ao gerar QR via node/qrcode. $nodeOutputText"
    }

    if (-not (Test-Path $qrPath)) {
      throw 'Arquivo de QR nao foi criado.'
    }

    Start-Process $qrPath
    Write-Host "QR aberto automaticamente: $qrPath" -ForegroundColor Green
    Write-Host 'Escaneie o QR com a camera do celular.' -ForegroundColor Green
  } catch {
    Write-Host 'Aviso: nao foi possivel abrir QR automaticamente.' -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    Write-Host "Use o link manualmente: $tunnelUrl" -ForegroundColor Yellow
  }
}

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
Write-Host 'Checklist de conexao externa:' -ForegroundColor Green
Write-Host '1) Compartilhe somente a URL https://***.trycloudflare.com exibida abaixo.' -ForegroundColor Green
Write-Host '2) Nao use localhost/127.0.0.1 no celular ou em outra rede.' -ForegroundColor Green
Write-Host '3) A URL do trycloudflare muda a cada execucao do script.' -ForegroundColor Green
Write-Host 'Pressione Ctrl+C para encerrar o tunnel.' -ForegroundColor Yellow
Write-Host ''

Set-Location -LiteralPath $scriptDir
$quickTunnelUrl = $null
$previousErrorActionPreference = $ErrorActionPreference

$ErrorActionPreference = 'Continue'
try {
  & $cloudflaredExe tunnel --url http://localhost:5173 --no-autoupdate 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line

    if (-not $quickTunnelUrl -and $line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
      $quickTunnelUrl = $matches[0]
      Write-Host ''
      Write-Host '================= LINK OFICIAL ====================' -ForegroundColor Cyan
      Write-Host "Copie e compartilhe este link: $quickTunnelUrl" -ForegroundColor Green
      Write-Host 'Escaneie o QR com a camera do celular.' -ForegroundColor Green
      Write-Host 'Todos os jogadores devem abrir esse link.' -ForegroundColor Green
      Write-Host 'Nao use localhost/127.0.0.1 nos celulares.' -ForegroundColor Yellow
      Write-Host '===================================================' -ForegroundColor Cyan
      Write-Host ''
      Show-TunnelQr -tunnelUrl $quickTunnelUrl
    }
  }
} finally {
  $ErrorActionPreference = $previousErrorActionPreference
}
