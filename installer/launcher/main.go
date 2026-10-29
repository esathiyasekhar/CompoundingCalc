// Compounding Calculator launcher: opens the bundled web app in its own app window
// (Microsoft Edge or Google Chrome "app mode"), or the default browser as a fallback.
package main

import (
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func exists(p string) bool { _, err := os.Stat(p); return err == nil }

func findBrowser() string {
	pf86 := os.Getenv("ProgramFiles(x86)")
	pf := os.Getenv("ProgramFiles")
	local := os.Getenv("LOCALAPPDATA")
	candidates := []string{
		filepath.Join(pf86, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(local, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf86, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(local, `Google\Chrome\Application\chrome.exe`),
	}
	for _, c := range candidates {
		if c != "" && exists(c) {
			return c
		}
	}
	return ""
}

func messageBox(text, title string, flags uintptr) {
	user32 := syscall.NewLazyDLL("user32.dll")
	mb := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(title)
	mb.Call(0, uintptr(unsafePointer(t)), uintptr(unsafePointer(c)), flags)
}

func main() {
	exe, err := os.Executable()
	if err != nil {
		return
	}
	index := filepath.Join(filepath.Dir(exe), "app", "index.html")
	if !exists(index) {
		messageBox("The calculator files are missing:\n"+index+"\n\nRun the setup again to repair the installation.", "Compounding Calculator", 0x10)
		return
	}
	u := url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(index)}
	link := u.String()

	if b := findBrowser(); b != "" {
		cmd := exec.Command(b, "--app="+link, "--start-maximized")
		if cmd.Start() == nil {
			return
		}
	}
	// Fallback: default browser
	cmd := exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", link)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	_ = cmd.Start()
}
