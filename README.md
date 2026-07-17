# POS Restaurante — Monorepo MVP

Sistema de ventas para restaurante pequeño. Monorepo con **Next.js** (frontend) y **NestJS** (backend) + **PostgreSQL** + **Prisma**.

## Estructura del proyecto

```
sistema-restaurante/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Modelo de datos
│   │   │   └── seed.ts         # Datos demo
│   │   └── src/
│   │       ├── auth/           # Login JWT + roles
│   │       ├── common/         # Guards y decorators
│   │       └── prisma/         # PrismaService
│   └── web/                    # Frontend Next.js
│       └── src/
│           ├── app/
│           │   ├── login/      # Pantalla de login
│           │   └── (dashboard)/dashboard/
│           ├── hooks/
│           └── lib/            # API client + auth
├── packages/
│   └── shared/                 # Enums y tipos compartidos
├── docker-compose.yml          # PostgreSQL local
└── package.json                # npm workspaces
```

## Requisitos

- Node.js 20+
- **Docker Desktop** en ejecución (para PostgreSQL)
- npm 10+

> **Nota:** Si `npm run db:up` falla, abre Docker Desktop y espera a que esté listo antes de continuar.
>
> **Puerto 5433:** El proyecto usa el puerto **5433** (no 5432) para evitar conflicto con PostgreSQL local de Windows.

## Comandos de instalación (primera vez)

```bash
# 1. Clonar / entrar al proyecto
cd "d:\SISTEMA RESTAURANTE"

# 2. Instalar dependencias del monorepo
npm install

# 3. Levantar PostgreSQL
npm run db:up

# 4. Copiar variables de entorno (si no existen)
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local

# 5. Aplicar migraciones (requiere Docker corriendo)
npm run db:deploy
# o, para desarrollo con historial interactivo:
# npm run db:migrate

# 6. Cargar datos demo (usuarios, categorías, productos)
npm run db:seed
```

## Comandos de desarrollo

```bash
# Levantar API + Frontend a la vez
npm run dev

# Solo backend (puerto 3001)
npm run dev:api

# Solo frontend (puerto 3000)
npm run dev:web

# Prisma Studio (explorar BD)
npm run db:studio
```

## URLs

| Servicio   | URL                                      |
|------------|------------------------------------------|
| Frontend   | http://localhost:3000                    |
| Login      | http://localhost:3000/login              |
| Dashboard  | http://localhost:3000/dashboard          |
| Menú público | http://localhost:3000/menu/mi-restaurante |
| Entrantes  | http://localhost:3000/entrantes          |
| Configuración | http://localhost:3000/configuracion (Jefa) |
| API Health | http://localhost:3001/api/v1/health      |
| API Login  | POST http://localhost:3001/api/v1/auth/login |

## Credenciales demo

| Rol    | Email                   | Contraseña   |
|--------|-------------------------|--------------|
| Jefa   | jefa@restaurante.com    | password123  |
| Cajera | cajera@restaurante.com  | password123  |

## Fase 0 — Completada

- [x] Monorepo con npm workspaces
- [x] NestJS + Prisma + PostgreSQL (Docker)
- [x] Schema inicial de base de datos
- [x] Seed con usuarios, categorías, productos y extras
- [x] Auth JWT con roles `CAJERA` y `JEFA`
- [x] Login en Next.js
- [x] Dashboard protegido por rol

## Fase 1 — Completada

- [x] CRUD categorías, productos y extras (solo Jefa)
- [x] API catálogo para POS (`GET /catalog`)

## Fase 2 — Completada

- [x] POS: crear pedidos (mesa / para llevar)
- [x] Lista y detalle de pedidos con cambio de estado

## Fase 3 — Completada

- [x] Cobro con efectivo y QR
- [x] Ticket de cocina HTML + `window.print()`

## Fase 4 — Completada (MVP listo)

- [x] Reporte de ventas del día — solo Jefa
- [x] Desglose por método de pago

## Fase 5 — Estabilización y producción

- [x] Zona horaria `America/La_Paz` (`RESTAURANT_TIMEZONE`)
- [x] Cálculo de **vuelto** en cobro efectivo
- [x] Atajo POS → cobro directo tras crear pedido
- [x] Health check con estado de base de datos
- [x] Validación JWT en producción
- [x] CORS multi-origen
- [x] Mejor manejo de errores en frontend
- [x] Script backup BD (`npm run db:backup`)
- [x] Guía de despliegue → [DEPLOYMENT.md](./DEPLOYMENT.md)

## Fase 6 — Pulido POS

- [x] Navegación inferior móvil (POS, Pedidos, Reportes)
- [x] Carrito en drawer + barra flotante en móvil
- [x] Botones táctiles más grandes en POS
- [x] Pago con **tarjeta**
- [x] Vista previa del ticket antes de imprimir
- [x] Reportes incluyen desglose de tarjeta

## Fase 7 — Menú público + entrantes

- [x] `OrderSource` (CAJA / MENU_PUBLICO) y `RestaurantSettings`
- [x] API pública: `GET /public/menu/:slug`, `POST /public/menu/:slug/orders`
- [x] Configuración del restaurante (slug, nombre, enlace) — solo Jefa
- [x] Pantalla `/menu/[slug]` sin login para clientes
- [x] Panel `/entrantes` con polling para pedidos públicos pendientes
- [x] Cobro en caja igual que pedidos normales

## Fase 8 — Delivery

- [x] Tipo `DELIVERY` en POS y menú público
- [x] Formulario: nombre, teléfono, dirección y referencia
- [x] Validaciones en API (campos obligatorios)
- [x] Ticket de cocina con datos de entrega
- [x] Filtro por tipo en lista de pedidos (incluye Delivery)

## Fase 9 — Reportes avanzados

- [x] Ventas por rango de fechas (hoy, semana, mes, personalizado)
- [x] API `GET /reports/range?from=&to=`
- [x] Top 10 productos más vendidos
- [x] Gráfico de barras por día
- [x] Copiar resumen y exportar PDF

## Fase 10 — Administración y configuración

- [x] CRUD usuarios (crear cajera/jefa, activar/desactivar)
- [x] Jefa puede restablecer contraseña de cualquier usuario
- [x] Cualquier usuario puede cambiar su contraseña (`/cuenta`)
- [x] Configuración: nombre, teléfono, slug, horario menú público

## Fase 11 — PWA + tiempo real

- [x] `manifest.webmanifest` + iconos instalables
- [x] Service worker básico (cache de assets)
- [x] SSE `GET /events/entrantes/stream` para pedidos en vivo
- [x] Entrantes: conexión en tiempo real con reconexión automática
- [x] Sonido y notificación del navegador en pedido nuevo

## Subida de imágenes

- [x] `POST /uploads/product-image` y `POST /uploads/logo` (solo Jefa, JWT)
- [x] Almacenamiento local en `apps/api/uploads/` (JPG, PNG, WebP, máx. 5 MB)
- [x] Archivos servidos en `/api/v1/uploads/files/{products|logos}/...`
- [x] Formularios de Productos y Configuración: subir imagen desde la computadora
- [x] Los campos `imageUrl` y `logoUrl` siguen guardando la URL resultante (sin cambio de schema)

Variables en `apps/api/.env`:

```env
API_PUBLIC_URL="http://localhost:3001"
# UPLOAD_DIR="uploads"   # opcional; por defecto apps/api/uploads
```

En producción, define `API_PUBLIC_URL` con la URL pública de la API y monta un volumen persistente para `uploads/`.

## Próxima fase (Fase 12)

- Hardware e integraciones (ESC/POS, pagos online, etc.)

## Comandos útiles de Prisma

```bash
# Nueva migración después de cambiar schema.prisma
npm run db:migrate

# Resetear BD y volver a seed
npm run db:reset
npm run db:seed

# Generar cliente Prisma
npm run prisma:generate -w api
```

## API Auth — Endpoints

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"cajera@restaurante.com\",\"password\":\"password123\"}"

# Perfil (requiere token)
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# Ruta solo Jefa
curl http://localhost:3001/api/v1/auth/admin-check \
  -H "Authorization: Bearer <TOKEN_JEFA>"
```

## API Catálogo — Endpoints (Fase 1)

Requieren `Authorization: Bearer <TOKEN>`.

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/categories` | Todos | Listar categorías (`?all=true` incluye inactivas) |
| POST | `/categories` | Jefa | Crear categoría |
| PATCH | `/categories/:id` | Jefa | Editar categoría |
| DELETE | `/categories/:id` | Jefa | Eliminar (soft delete) |
| GET | `/extras` | Todos | Listar extras |
| POST/PATCH/DELETE | `/extras/:id` | Jefa | CRUD extras |
| GET | `/products` | Todos | Listar productos (`?categoryId=&all=true`) |
| POST/PATCH/DELETE | `/products/:id` | Jefa | CRUD productos |
| GET | `/catalog` | Todos | Catálogo completo para POS |
