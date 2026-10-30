// Compounding Calculator — per-user Windows installer / uninstaller.
// No admin rights needed. Installs to %LOCALAPPDATA%\Programs\Compounding Calculator,
// adds Start menu + desktop shortcuts and an entry in Settings > Apps for uninstalling.
package main

import (
	"embed"
	"encoding/base64"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unicode/utf16"
	"unsafe"
)

//go:embed payload
var payload embed.FS

const (
	appName    = "Compounding Calculator"
	appVersion = "1.18"
	regKey     = `HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\CompoundingCalculator`

	mbOK          = 0x0
	mbYesNo       = 0x4
	mbIconInfo    = 0x40
	mbIconWarn    = 0x30
	mbIconError   = 0x10
	mbIconQuestion = 0x20
	idYes         = 6
)

func msg(text string, flags uintptr) int {
	user32 := syscall.NewLazyDLL("user32.dll")
	mb := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(appName + " " + appVersion)
	r, _, _ := mb.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), flags)
	return int(r)
}

func installDir() string {
	return filepath.Join(os.Getenv("LOCALAPPDATA"), "Programs", appName)
}

// psQuote makes a PowerShell single-quoted string literal.
func psQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func runPowerShell(script string) error {
	u := utf16.Encode([]rune(script))
	b := make([]byte, len(u)*2)
	for i, v := range u {
		b[2*i] = byte(v)
		b[2*i+1] = byte(v >> 8)
	}
	enc := base64.StdEncoding.EncodeToString(b)
	cmd := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", enc)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%v: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}

func extract(dst string) (int64, error) {
	var total int64
	err := fs.WalkDir(payload, "payload", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel := strings.TrimPrefix(p, "payload")
		rel = strings.TrimPrefix(rel, "/")
		target := filepath.Join(dst, filepath.FromSlash(rel))
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		data, err := payload.ReadFile(p)
		if err != nil {
			return err
		}
		total += int64(len(data))
		return os.WriteFile(target, data, 0o644)
	})
	return total, err
}

func copySelf(dst string) error {
	self, err := os.Executable()
	if err != nil {
		return err
	}
	if strings.EqualFold(filepath.Clean(self), filepath.Clean(dst)) {
		return nil
	}
	data, err := os.ReadFile(self)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o755)
}

func install() {
	dir := installDir()
	existing := false
	if _, err := os.Stat(filepath.Join(dir, appName+".exe")); err == nil {
		existing = true
	}
	q := "Install " + appName + " " + appVersion + " for this Windows user?\n\n" +
		"Location: " + dir + "\n" +
		"Shortcuts: Start menu and desktop\n\n" +
		"No administrator rights are needed."
	if existing {
		q = appName + " is already installed. Update it to version " + appVersion + "?\n\n" +
			"Your saved profiles are kept (they live in your browser, not in the program folder)."
	}
	if msg(q, mbYesNo|mbIconQuestion) != idYes {
		return
	}

	if err := os.MkdirAll(dir, 0o755); err != nil {
		msg("Could not create the program folder:\n"+err.Error(), mbOK|mbIconError)
		return
	}
	// Remove old app files so deleted files don't linger after an update
	_ = os.RemoveAll(filepath.Join(dir, "app"))
	size, err := extract(dir)
	if err != nil {
		msg("Could not copy the program files:\n"+err.Error()+"\n\nIf the calculator is open, close it and run setup again.", mbOK|mbIconError)
		return
	}
	uninstaller := filepath.Join(dir, "Uninstall.exe")
	if err := copySelf(uninstaller); err != nil {
		msg("Could not write the uninstaller:\n"+err.Error(), mbOK|mbIconError)
		return
	}

	// A local (non-OneDrive) folder for an optional database file that stays on this PC
	dataDir := filepath.Join(os.Getenv("USERPROFILE"), appName+" Data")
	_ = os.MkdirAll(dataDir, 0o755)
	_ = os.WriteFile(filepath.Join(dataDir, "README.txt"), []byte(
		"Optional local database for "+appName+".\r\n\r\n"+
			"In the app: Manage > Create database file... and save it in this folder\r\n"+
			"to keep all users and year-end records on this PC only (no cloud).\r\n"+
			"The app rewrites the file automatically after every change.\r\n"), 0o644)

	launcher := filepath.Join(dir, appName+".exe")
	icon := filepath.Join(dir, "app_icon.ico")
	script := `
$ErrorActionPreference = 'Stop'
$target = ` + psQuote(launcher) + `
$icon = ` + psQuote(icon) + `
$work = ` + psQuote(dir) + `
$sh = New-Object -ComObject WScript.Shell
foreach ($folder in @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('Desktop'))) {
  if (-not $folder) { continue }
  $lnk = $sh.CreateShortcut((Join-Path $folder ` + psQuote(appName+".lnk") + `))
  $lnk.TargetPath = $target
  $lnk.WorkingDirectory = $work
  $lnk.IconLocation = "$icon,0"
  $lnk.Description = 'Core + Satellite compounding calculator'
  $lnk.Save()
}
$k = ` + psQuote(regKey) + `
New-Item -Path $k -Force | Out-Null
Set-ItemProperty -Path $k -Name DisplayName -Value ` + psQuote(appName) + `
Set-ItemProperty -Path $k -Name DisplayVersion -Value ` + psQuote(appVersion) + `
Set-ItemProperty -Path $k -Name Publisher -Value 'Sathiya Sekhar E'
Set-ItemProperty -Path $k -Name Comments -Value 'Warren Charlie Study group - TechnoFunda Top Guns'
Set-ItemProperty -Path $k -Name DisplayIcon -Value $icon
Set-ItemProperty -Path $k -Name InstallLocation -Value $work
Set-ItemProperty -Path $k -Name UninstallString -Value ('"' + ` + psQuote(uninstaller) + ` + '" /uninstall')
Set-ItemProperty -Path $k -Name QuietUninstallString -Value ('"' + ` + psQuote(uninstaller) + ` + '" /uninstall /quiet')
Set-ItemProperty -Path $k -Name NoModify -Value 1 -Type DWord
Set-ItemProperty -Path $k -Name NoRepair -Value 1 -Type DWord
Set-ItemProperty -Path $k -Name EstimatedSize -Value ` + fmt.Sprint(size/1024+1) + ` -Type DWord
`
	if err := runPowerShell(script); err != nil {
		msg("The program was copied, but shortcuts could not be created:\n"+err.Error()+
			"\n\nYou can start it from:\n"+launcher, mbOK|mbIconWarn)
		return
	}

	if msg(appName+" is installed.\n\nFor a database that stays on this PC, use Manage > Create database file and save it in:\n"+dataDir+"\n\nOpen the calculator now?", mbYesNo|mbIconInfo) == idYes {
		cmd := exec.Command(launcher)
		cmd.Dir = dir
		_ = cmd.Start()
	}
}

func uninstall(quiet bool) {
	dir := installDir()
	if !quiet && msg("Remove "+appName+" from this computer?\n\n"+
		"Users saved in the browser stay there, and your database file (if any) is not touched.\nTo keep a copy, use Manage → Export all users first.",
		mbYesNo|mbIconQuestion) != idYes {
		return
	}
	script := `
$ErrorActionPreference = 'SilentlyContinue'
foreach ($folder in @([Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('Desktop'))) {
  if ($folder) { Remove-Item -LiteralPath (Join-Path $folder ` + psQuote(appName+".lnk") + `) -Force }
}
Remove-Item -Path ` + psQuote(regKey) + ` -Recurse -Force
`
	_ = runPowerShell(script)

	if !quiet {
		msg(appName+" has been removed.", mbOK|mbIconInfo)
	}
	// This uninstaller runs from inside the folder, so the folder is deleted a few
	// seconds after this process exits.
	del := exec.Command("cmd.exe", "/c", "ping -n 4 127.0.0.1 >nul & rmdir /s /q \""+dir+"\"")
	del.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	_ = del.Start()
}

func main() {
	args := strings.ToLower(strings.Join(os.Args[1:], " "))
	self, _ := os.Executable()
	isUninstaller := strings.EqualFold(filepath.Base(self), "Uninstall.exe")
	switch {
	case strings.Contains(args, "/uninstall") || isUninstaller:
		uninstall(strings.Contains(args, "/quiet"))
	default:
		install()
	}
}
