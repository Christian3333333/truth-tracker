# Demo: POST /api/verify with San Miguel transcript (requires real API keys in .env)
# Usage: npm run dev (in another terminal), then npm run demo:verify

$transcript = @"
En San Miguel hay 3000 extorsiones en este año, la mayoría de asaltos son por venezolanos y por motos. Por eso, para acabar con ella vamos a instalar más cámaras y vamos a sacar más policías a las calles.
"@

$body = @{ transcript = $transcript.Trim() } | ConvertTo-Json -Compress
$started = Get-Date

$response = Invoke-RestMethod `
  -Uri "http://localhost:3000/api/verify" `
  -Method POST `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

$elapsed = ((Get-Date) - $started).TotalSeconds
$sections = @("correcta", "falsa", "sin_evidencia", "selectiva", "analisis_medidas")

Write-Host "Elapsed: $([math]::Round($elapsed, 1))s"
foreach ($section in $sections) {
  if (-not $response.PSObject.Properties.Name.Contains($section)) {
    throw "Missing section: $section"
  }
}
Write-Host "OK — all five sections present"
if ($response.correcta.Count -lt 1 -or $response.falsa.Count -lt 1 -or $response.sin_evidencia.Count -lt 1) {
  throw "Expected populated correcta, falsa, and sin_evidencia arrays"
}
if ($response.analisis_medidas.medidas_propuestas.Count -lt 1) {
  throw "Expected analisis_medidas.medidas_propuestas to be populated"
}
$response | ConvertTo-Json -Depth 6

if ($elapsed -gt 90) {
  Write-Warning "Response exceeded 90s threshold"
  exit 1
}
