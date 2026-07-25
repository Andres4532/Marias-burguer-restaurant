# Instalación en una sola laptop (Windows) — POS Restaurante
# Ejecutar en PowerShell desde la raíz del proyecto:
#   powershell -ExecutionPolicy Bypass -File scripts\instalar-lap.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== POS Restaurante — instalacion en laptop ===" -ForegroundColor Cyan
Write-Host "Carpeta: $Root`n"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "No se encontro '$name'. Instala Node 20 LTS y Docker Desktop antes de continuar."
  }
}

Require-Command node
Require-Command npm
Require-Command docker

$nodeVer = node -p "process.versions.node"
Write-Host "Node: $nodeVer"

Write-Host "`n[1/7] npm install..." -ForegroundColor Yellow
npm install

Write-Host "`n[2/7] Archivos .env..." -ForegroundColor Yellow
if (-not (Test-Path "apps\api\.env")) {
  Copy-Item "apps\api\.env.example" "apps\api\.env"
  Write-Host "  Creado apps\api\.env"
} else {
  Write-Host "  apps\api\.env ya existe (no se sobrescribe)"
}

if (-not (Test-Path "apps\web\.env.local")) {
  Copy-Item "apps\web\.env.example" "apps\web\.env.local"
  Write-Host "  Creado apps\web\.env.local"
} else {
  Write-Host "  apps\web\.env.local ya existe (no se sobrescribe)"
}

Write-Host "`n[3/7] Docker PostgreSQL..." -ForegroundColor Yellow
docker compose up -d
Write-Host "  Esperando base de datos..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  $status = docker inspect -f "{{.State.Health.Status}}" restaurante-postgres 2>$null
  if ($status -eq "healthy") { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) {
  Write-Warning "El contenedor no reporto healthy a tiempo. Revisa Docker Desktop."
}

Write-Host "`n[4/7] Migraciones..." -ForegroundColor Yellow
npm run db:deploy

Write-Host "`n[5/7] Datos iniciales (seed)..." -ForegroundColor Yellow
$seed = Read-Host "  Cargar datos demo? (S/n)"
if ($seed -eq "" -or $seed -eq "S" -or $seed -eq "s") {
  npm run db:seed
} else {
  Write-Host "  Seed omitido."
}

Write-Host "`n[6/7] Build (comprueba que compila)..." -ForegroundColor Yellow
npm run build -w api
npm run build -w web

Write-Host "`n[7/7] Listo." -ForegroundColor Green
Write-Host @"

Para usar el sistema cada dia:
  1. Abrir Docker Desktop
  2. En esta carpeta: npm run dev
  3. Navegador: http://localhost:3000/login

Menu publico (misma laptop, otra pestana):
  http://localhost:3000/menu/mi-restaurante
  (cambia el slug en Configuracion si es distinto)

Demo (cambiar contrasenas despues):
  jefa@restaurante.com / cajera@restaurante.com — password123

"@
