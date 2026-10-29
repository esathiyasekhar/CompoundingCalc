#!/usr/bin/env bash
# Builds dist/CompoundingCalculator-Setup.exe from macOS or Linux (cross-compiles for Windows).
# Needs Go 1.21+. Optional: rsrc to refresh the icon/version resource
#   go install github.com/akavel/rsrc@latest
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(dirname "$here")"
cd "$here"

# 1. Icon + manifest resource (only if rsrc is installed; the committed .syso files work otherwise)
if command -v rsrc >/dev/null 2>&1; then
  rsrc -manifest manifest.xml -ico app_icon.ico -arch amd64 -o launcher/rsrc_windows_amd64.syso
  rsrc -manifest manifest.xml -ico app_icon.ico -arch amd64 -o setup/rsrc_windows_amd64.syso
fi

# 2. Payload: launcher + the app files + manuals
payload="$here/setup/payload"
rm -rf "$payload" && mkdir -p "$payload/app/manual/img"
export GOOS=windows GOARCH=amd64 CGO_ENABLED=0
(cd launcher && go build -trimpath -ldflags "-s -w -H windowsgui" -o "$payload/Compounding Calculator.exe" .)
cp app_icon.ico "$payload/"
cp "$root"/{index.html,app.js,calculator.js,styles.css} "$payload/app/"
cp "$root"/manual/*.{html,css,js,pdf} "$payload/app/manual/"
cp "$root"/manual/img/*.jpg "$payload/app/manual/img/"

# 3. Setup program with the payload embedded
mkdir -p "$root/dist"
(cd setup && go build -trimpath -ldflags "-s -w -H windowsgui" -o "$root/dist/CompoundingCalculator-Setup.exe" .)
echo "Built $root/dist/CompoundingCalculator-Setup.exe"
