# Demo checklist: extension Truth Tracker (tickets 02-03)
# Prerequisites:
#   1. Backend running: npm run dev
#   2. Extension built: npm run build:extension
#   3. Chrome -> chrome://extensions -> Developer mode -> Load unpacked -> select todo/extension

$ErrorActionPreference = "Stop"

$extensionDir = Join-Path $PSScriptRoot "..\extension" | Resolve-Path
$manifest = Join-Path $extensionDir "manifest.json"
$background = Join-Path $extensionDir "dist\background.js"
$content = Join-Path $extensionDir "dist\content.js"
$popup = Join-Path $extensionDir "dist\popup.js"

if (-not (Test-Path $manifest)) { throw "Missing manifest.json" }
if (-not (Test-Path $background)) { throw "Missing dist/background.js - run npm run build:extension" }
if (-not (Test-Path $content)) { throw "Missing dist/content.js - run npm run build:extension" }
if (-not (Test-Path $popup)) { throw "Missing dist/popup.js - run npm run build:extension" }

$manifestJson = Get-Content $manifest -Raw | ConvertFrom-Json
if ($manifestJson.manifest_version -ne 3) { throw "Expected MV3" }
if (-not $manifestJson.background.service_worker) { throw "Missing service worker" }
if (-not $manifestJson.content_scripts) { throw "Missing content_scripts" }
if (-not $manifestJson.action.default_popup) { throw "Missing popup" }

Write-Host "OK - extension package looks loadable from:"
Write-Host "  $extensionDir"
Write-Host ""
Write-Host "Manual demo steps:"
Write-Host "  1. Load unpacked the folder above in Chrome"
Write-Host "  2. Open https://www.instagram.com/reels/ (any reel)"
Write-Host "  3. Ticket 02: click floating Verificar -> paste San Miguel script -> Verificar texto"
Write-Host "  4. Ticket 03: OR open popup -> set backend URL -> Verificar reel actual -> same modal/panel flow"
Write-Host "  5. Confirm side panel shows correcta/falsa/sin_evidencia/selectiva/analisis_medidas with sources"
Write-Host ""
Write-Host "San Miguel transcript:"
Write-Host "En San Miguel hay 3000 extorsiones en este ano, la mayoria de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar mas camaras y vamos a sacar mas policias a las calles."
