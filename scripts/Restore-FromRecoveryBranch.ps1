<#
.SYNOPSIS
  Restore paths from a safety recovery branch (recover/lost-audit or recover/api-bundle).

.DESCRIPTION
  Use this AFTER reading docs/GIT_RECOVERY_AND_SAFETY.md.
  This runs: git checkout <recovery-branch> -- <path>
  which overwrites those paths in your working tree with the snapshot from that branch.

.EXAMPLE
  .\scripts\Restore-FromRecoveryBranch.ps1 -Source audit -Path mobile

.EXAMPLE
  .\scripts\Restore-FromRecoveryBranch.ps1 -Source api -Path mobile/src/api -DryRun
#>

param(
    [ValidateSet('audit', 'api')]
    [string] $Source = 'audit',

    [string] $Path = 'mobile',

    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

$branchMap = @{
    audit = 'recover/lost-audit'
    api   = 'recover/api-bundle'
}

$branch = $branchMap[$Source]

if (-not (git rev-parse --verify $branch 2>$null)) {
    Write-Error "Branch '$branch' does not exist. Create it with: git branch recover/lost-audit <commit> (see docs)."
}

Write-Host ""
Write-Host "Recovery source: $branch"
Write-Host "Target path:     $Path"
Write-Host ""
Write-Host "This will REPLACE files under '$Path' with versions from '$branch'."
Write-Host "Recommended first: git stash push -u -m 'backup before recovery checkout'"
Write-Host ""

if ($DryRun) {
    Write-Host "[DryRun] Would run: git checkout $branch -- $Path"
    exit 0
}

$confirm = Read-Host "Type YES to continue"
if ($confirm -ne 'YES') {
    Write-Host "Aborted."
    exit 1
}

git checkout $branch -- $Path
Write-Host ""
Write-Host "Done. Review with: git status"
Write-Host "Then commit when satisfied."
