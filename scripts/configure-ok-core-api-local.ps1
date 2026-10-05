param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [string]$ContextApiToken = '',
    [string]$BaseUrl = 'http://localhost:8888/OK-Core/api/v1',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot 'php\ok_core_api_local.php'

if ((Test-Path -LiteralPath $configPath) -and -not $Force) {
    throw "$configPath already exists. Use -Force to replace it."
}
if ([string]::IsNullOrWhiteSpace($ContextApiToken)) {
    $ContextApiToken = $Token
}

$escapedBaseUrl = $BaseUrl.Replace("'", "\'")
$escapedToken = $Token.Replace("'", "\'")
$escapedContextToken = $ContextApiToken.Replace("'", "\'")
$config = @"
<?php

declare(strict_types=1);

return [
    'base_url' => '$escapedBaseUrl',
    'token' => '$escapedToken',
    'system_code' => 'forest-platform',
    'timeout_seconds' => 10,
    'context_api_token' => '$escapedContextToken',
];
"@

[System.IO.File]::WriteAllText(
    $configPath,
    $config,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "Created: $configPath"
Write-Host 'The file is excluded from Git.'
