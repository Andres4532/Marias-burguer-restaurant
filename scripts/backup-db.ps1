# Backup de PostgreSQL — Windows (PowerShell)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\backups"
$backupFile = Join-Path $backupDir "restaurante_pos_$timestamp.sql"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "Creando backup en $backupFile ..."

docker exec restaurante-postgres pg_dump -U restaurante restaurante_pos > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completado: $backupFile"
} else {
    Write-Host "Error al crear backup. Verifica que Docker y el contenedor esten corriendo."
    exit 1
}
