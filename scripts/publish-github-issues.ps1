# Publish Truth Tracker spec and MVP tickets to GitHub Issues.
# Requires: gh auth login

$ErrorActionPreference = "Stop"
$Repo = "Christian3333333/truth-tracker"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

function New-Issue {
  param(
    [string]$Title,
    [string]$BodyFile,
    [string[]]$Labels = @()
  )

  $args = @("issue", "create", "--repo", $Repo, "--title", $Title, "--body-file", $BodyFile)
  foreach ($label in $Labels) {
    $args += @("--label", $label)
  }

  $output = & gh @args
  if ($LASTEXITCODE -ne 0) { throw "gh issue create failed for: $Title" }
  if ($output -match '#(\d+)') { return [int]$Matches[1] }
  if ($output -match '/issues/(\d+)') { return [int]$Matches[1] }
  throw "Could not parse issue number from: $output"
}

function Get-IssueTitleFromMarkdown {
  param([string]$Path)
  $firstLine = (Get-Content $Path -TotalCount 1 -Encoding UTF8)
  return $firstLine.TrimStart("#").Trim()
}

& gh auth status --hostname github.com | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "gh is not authenticated. Run: gh auth login"
}

$labels = @("mvp", "ready-for-agent", "spec", "done")
foreach ($label in $labels) {
  & gh label create $label --repo $Repo --force 2>$null | Out-Null
}

$existingSpec = (& gh issue list --repo $Repo --search "Truth Tracker MVP - Specification in:title" --json number,title --limit 1 | ConvertFrom-Json)
if ($existingSpec.Count -gt 0) {
  $specIssue = [int]$existingSpec[0].number
  Write-Host "Using existing spec issue #$specIssue"
} else {
  $specBody = Join-Path $Root "spec.md"
  $specIssue = New-Issue -Title "Truth Tracker MVP - Specification" -BodyFile $specBody -Labels @("spec", "mvp")
  Write-Host "Created spec issue #$specIssue"
}

$tickets = @(
  @{ Num = "01"; File = "01-verification-api.md"; BlockedBy = @(); Labels = @("mvp", "ready-for-agent", "done") },
  @{ Num = "04"; File = "04-spike-instagram-extraction.md"; BlockedBy = @(); Labels = @("mvp", "ready-for-agent") },
  @{ Num = "02"; File = "02-manual-verify-instagram.md"; BlockedBy = @("01"); Labels = @("mvp", "ready-for-agent") },
  @{ Num = "03"; File = "03-popup-activation-auto-panel.md"; BlockedBy = @("02"); Labels = @("mvp", "ready-for-agent") },
  @{ Num = "05"; File = "05-floating-button-auto-extraction.md"; BlockedBy = @("03", "04"); Labels = @("mvp", "ready-for-agent") },
  @{ Num = "06"; File = "06-soft-atelier-glow-polish.md"; BlockedBy = @("03"); Labels = @("mvp", "ready-for-agent") }
)

$issueIds = @{ "spec" = $specIssue }

foreach ($ticket in $tickets) {
  $source = Join-Path $Root ".scratch/truth-tracker-mvp/issues/$($ticket.File)"
  $title = Get-IssueTitleFromMarkdown -Path $source
  $existing = (& gh issue list --repo $Repo --search "$title in:title" --json number,title --limit 5 | ConvertFrom-Json) | Where-Object { $_.title -eq $title }
  if ($existing) {
    $issueIds[$ticket.Num] = [int]$existing[0].number
    Write-Host "Skipping ticket $($ticket.Num); already issue #$($issueIds[$ticket.Num])"
    continue
  }
  $tempBody = Join-Path $env:TEMP "truth-tracker-issue-$($ticket.Num).md"
  $content = Get-Content $source -Raw -Encoding UTF8
  $content += "`n`n---`n**Spec:** #$specIssue (spec.md)"
  if ($ticket.BlockedBy.Count -gt 0) {
    $refs = ($ticket.BlockedBy | ForEach-Object { "#$($issueIds[$_])" }) -join ", "
    $content += "`n**Blocked by:** $refs"
  }
  [System.IO.File]::WriteAllText($tempBody, $content, [System.Text.UTF8Encoding]::new($false))
  $num = New-Issue -Title $title -BodyFile $tempBody -Labels $ticket.Labels
  $issueIds[$ticket.Num] = $num
  Write-Host "Created ticket $($ticket.Num) as issue #$num"
}

Write-Host ""
Write-Host "All issues published:"
& gh issue list --repo $Repo --limit 20
