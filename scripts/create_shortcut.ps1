$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Nest.lnk"
$targetExe = "C:\Users\neera\Documents\Projects\Nest\src-tauri\target\release\nest.exe"
$workingDir = "C:\Users\neera\Documents\Projects\Nest\src-tauri\target\release"
$iconPath = "C:\Users\neera\Documents\Projects\Nest\src-tauri\icons\icon.ico"

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetExe
$shortcut.WorkingDirectory = $workingDir
$shortcut.IconLocation = $iconPath
$shortcut.Description = "Nest - Personal Finance OS"
$shortcut.Save()

Write-Host "Desktop shortcut created at: $shortcutPath"
