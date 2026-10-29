# Builds dist\CompoundingCalculator-Setup.exe on Windows.
# Needs Go 1.21+ (https://go.dev/dl/). Optional: rsrc to refresh the icon/version resource
#   go install github.com/akavel/rsrc@latest
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File installer\build.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
Set-Location $here

# 1. Icon + manifest resource (only if rsrc is installed; the committed .syso files work otherwise)
$rsrc = Get-Command rsrc -ErrorAction SilentlyContinue
if ($rsrc) {
  & rsrc -manifest manifest.xml -ico app_icon.ico -arch amd64 -o launcher\rsrc_windows_amd64.syso
  & rsrc -manifest manifest.xml -ico app_icon.ico -arch amd64 -o setup\rsrc_windows_amd64.syso
}

# 2. Payload: launcher + the app files + manuals
$payload = Join-Path $here 'setup\payload'
if (Test-Path $payload) { Remove-Item $payload -Recurse -Force }
New-Item -ItemType Directory -Force -Path "$payload\app\manual\img" | Out-Null
$env:GOOS = 'windows'; $env:GOARCH = 'amd64'; $env:CGO_ENABLED = '0'
Push-Location launcher
go build -trimpath -ldflags "-s -w -H windowsgui" -o "$payload\Compounding Calculator.exe" .
Pop-Location
Copy-Item app_icon.ico $payload
Copy-Item "$root\index.html","$root\app.js","$root\calculator.js","$root\styles.css" "$payload\app"
Copy-Item "$root\manual\*.html","$root\manual\*.css","$root\manual\*.js","$root\manual\*.pdf" "$payload\app\manual"
Copy-Item "$root\manual\img\*.jpg" "$payload\app\manual\img"

# 3. Setup program with the payload embedded
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null
Push-Location setup
go build -trimpath -ldflags "-s -w -H windowsgui" -o "$root\dist\CompoundingCalculator-Setup.exe" .
Pop-Location
Write-Host "Built $root\dist\CompoundingCalculator-Setup.exe"
