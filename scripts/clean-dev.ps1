# Libera puertos 3000/3001 y limpia cache de Next.js antes de desarrollar.
$ports = 3000, 3001, 3002
foreach ($port in $ports) {
  $lines = netstat -ano | Select-String ":$port\s+.*LISTENING"
  foreach ($line in $lines) {
    $processId = ($line -split '\s+')[-1]
    if ($processId -match '^\d+$') {
      taskkill /PID $processId /F 2>$null | Out-Null
    }
  }
}

$nextDir = Join-Path $PSScriptRoot "..\apps\web\.next"
if (Test-Path $nextDir) {
  Remove-Item -Recurse -Force $nextDir
  Write-Host "Cache .next eliminada"
}

Write-Host "Puertos liberados. Ejecuta: npm run dev"
