param([switch]$Uninstall)
$ErrorActionPreference = "Stop"
$taskName = "ArxivInsightsPaperPublisher"
$scriptPath = Join-Path $PSScriptRoot "watch_papers.py"
if ($Uninstall) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed task $taskName"
    exit 0
}
$python = (Get-Command python.exe -ErrorAction Stop).Source
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$arguments = ('"{0}" --interval 60' -f $scriptPath)
$action = New-ScheduledTaskAction -Execute $python -Argument $arguments -WorkingDirectory (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 3
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State
Write-Host "Log: $env:LOCALAPPDATA\ArxivInsights\publisher.log"
