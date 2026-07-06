[CmdletBinding()]
param(
    [string]$PhpBin = $env:PHP_BIN,
    [string]$ComposerBin = $env:COMPOSER_BIN
)

$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

function Resolve-PhpBin {
    param([string]$Candidate)

    if ($Candidate) {
        return $Candidate
    }

    $mampPhpRoots = @(
        'C:\MAMP\bin\php\php8.3.14\php.exe',
        'C:\MAMP\bin\php\php8.3.1\php.exe'
    )

    foreach ($path in $mampPhpRoots) {
        if (Test-Path $path) {
            return $path
        }
    }

    $phpCommand = Get-Command php -ErrorAction SilentlyContinue
    if ($phpCommand) {
        return $phpCommand.Source
    }

    throw 'PHP was not found. Set PHP_BIN and rerun this script.'
}

function Resolve-ComposerInvocation {
    param([string]$Candidate, [string]$ResolvedPhpBin, [string]$ProjectRoot)

    if ($Candidate) {
        if ($Candidate.ToLowerInvariant().EndsWith('.phar')) {
            return @{
                FilePath = $ResolvedPhpBin
                ArgumentList = @($Candidate, 'install')
            }
        }

        return @{
            FilePath = $Candidate
            ArgumentList = @('install')
        }
    }

    $projectComposerPhar = Join-Path $ProjectRoot 'composer.phar'
    if (Test-Path $projectComposerPhar) {
        return @{
            FilePath = $ResolvedPhpBin
            ArgumentList = @($projectComposerPhar, 'install')
        }
    }

    $composerCommand = Get-Command composer -ErrorAction SilentlyContinue
    if ($composerCommand) {
        return @{
            FilePath = $composerCommand.Source
            ArgumentList = @('install')
        }
    }

    throw 'Composer was not found. Set COMPOSER_BIN and rerun this script.'
}

function Get-PhpRuntimeOptions {
    param([string]$ResolvedPhpBin)

    $phpDir = Split-Path -Parent $ResolvedPhpBin
    $extDir = Join-Path $phpDir 'ext'
    $options = @('-n')

    if (Test-Path $extDir) {
        $options += '-d'
        $options += "extension_dir=$extDir"
    }

    if (Test-Path (Join-Path $extDir 'php_openssl.dll')) {
        $options += '-d'
        $options += 'extension=openssl'
    }

    if (Test-Path (Join-Path $extDir 'php_curl.dll')) {
        $options += '-d'
        $options += 'extension=curl'
    }

    if (Test-Path (Join-Path $extDir 'php_zip.dll')) {
        $options += '-d'
        $options += 'extension=zip'
    }

    return $options
}

function Ensure-ComposerPhar {
    param([string]$ResolvedPhpBin, [string]$ProjectRoot, [string[]]$PhpRuntimeOptions)

    $composerPharPath = Join-Path $ProjectRoot 'composer.phar'
    if (Test-Path $composerPharPath) {
        return $composerPharPath
    }

    $installerPath = Join-Path $ProjectRoot 'composer-setup.php'
    try {
        Invoke-WebRequest -Uri 'https://getcomposer.org/installer' -OutFile $installerPath
        $null = & $ResolvedPhpBin @PhpRuntimeOptions $installerPath --install-dir=$ProjectRoot --filename=composer.phar
        if ($LASTEXITCODE -ne 0) {
            throw 'Composer installer execution failed.'
        }
    } finally {
        if (Test-Path $installerPath) {
            Remove-Item $installerPath -Force
        }
    }

    if (!(Test-Path $composerPharPath)) {
        throw 'Composer download failed. Set COMPOSER_BIN and rerun this script.'
    }

    return $composerPharPath
}

function Ensure-CaBundle {
    param([string]$ProjectRoot)

    $certsDir = Join-Path $ProjectRoot 'certs'
    $caBundlePath = Join-Path $certsDir 'cacert.pem'
    if (Test-Path $caBundlePath) {
        return
    }

    if (!(Test-Path $certsDir)) {
        New-Item -ItemType Directory -Path $certsDir | Out-Null
    }

    Invoke-WebRequest -Uri 'https://curl.se/ca/cacert.pem' -OutFile $caBundlePath
}

$resolvedPhpBin = Resolve-PhpBin -Candidate $PhpBin
$phpRuntimeOptions = Get-PhpRuntimeOptions -ResolvedPhpBin $resolvedPhpBin

$env:COMPOSER_HOME = Join-Path $rootDir '.composer'
if (!(Test-Path $env:COMPOSER_HOME)) {
    New-Item -ItemType Directory -Path $env:COMPOSER_HOME | Out-Null
}

try {
    $composerInvocation = Resolve-ComposerInvocation -Candidate $ComposerBin -ResolvedPhpBin $resolvedPhpBin -ProjectRoot $rootDir
} catch {
    if ($ComposerBin) {
        throw
    }

    $composerPharPath = Ensure-ComposerPhar -ResolvedPhpBin $resolvedPhpBin -ProjectRoot $rootDir -PhpRuntimeOptions $phpRuntimeOptions
    $composerInvocation = @{
        FilePath = $resolvedPhpBin
        ArgumentList = @($composerPharPath, 'install')
    }
}

if ($composerInvocation.FilePath -eq $resolvedPhpBin) {
    & $composerInvocation.FilePath @phpRuntimeOptions @($composerInvocation.ArgumentList)
} else {
    & $composerInvocation.FilePath @($composerInvocation.ArgumentList)
}

if ($LASTEXITCODE -ne 0) {
    throw 'Composer install failed.'
}

if (!(Test-Path (Join-Path $rootDir 'vendor\autoload.php'))) {
    throw 'Composer install did not create vendor/autoload.php.'
}

Ensure-CaBundle -ProjectRoot $rootDir

$ssoLocalPath = Join-Path $rootDir 'php\sso_local.php'
$ssoExamplePath = Join-Path $rootDir 'php\sso_local.example.php'
if (!(Test-Path $ssoLocalPath) -and (Test-Path $ssoExamplePath)) {
    Copy-Item $ssoExamplePath $ssoLocalPath
    Write-Host 'Created php/sso_local.php from php/sso_local.example.php.'
    Write-Host 'Edit php/sso_local.php and set your local SSO credentials.'
}

Write-Host 'Local setup complete.'
