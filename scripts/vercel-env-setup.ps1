# Vercel ortam degiskenlerini ayarlar (once: npx vercel login)
# Kullanim: .\scripts\vercel-env-setup.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path ".env.local")) {
  Write-Error ".env.local bulunamadi"
}

Get-Content ".env.local" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  if ($_ -match '^([^=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    Write-Host "Setting $name ..."
    npx vercel env add $name production --force 2>$null
    $value | npx vercel env add $name production
    npx vercel env add $name preview --force 2>$null
    $value | npx vercel env add $name preview
    npx vercel env add $name development --force 2>$null
    $value | npx vercel env add $name development
  }
}

Write-Host "Tamam. Yeniden deploy: npx vercel --prod"
