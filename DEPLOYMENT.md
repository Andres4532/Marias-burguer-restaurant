# Guía de despliegue — POS Restaurante

Esta guía cubre cómo llevar el sistema del entorno local a un servidor accesible desde el restaurante.

---

## Arquitectura de producción recomendada

```
[ Celular/Laptop cajera ]  →  HTTPS  →  [ Frontend Next.js ]
                                              ↓
                                         [ API NestJS ]
                                              ↓
                                         [ PostgreSQL ]
```

### Opciones de hosting (bajo costo)

| Componente | Opción A | Opción B |
|------------|----------|----------|
| Frontend | Vercel (gratis) | VPS + Node |
| API | Railway / Render | Mismo VPS |
| PostgreSQL | Railway / Render / Supabase | Docker en VPS |

**Mínimo para empezar:** un VPS (2 GB RAM) con Docker para API + Postgres, y Vercel para el frontend.

---

## 1. Variables de entorno en producción

### API (`apps/api/.env`)

```env
NODE_ENV=production
DATABASE_URL=postgresql://usuario:password@host:5432/restaurante_pos?schema=public
API_PORT=3001
JWT_SECRET=<secreto-aleatorio-minimo-32-caracteres>
JWT_EXPIRES_IN=8h
RESTAURANT_TIMEZONE=America/La_Paz
CORS_ORIGIN=https://tu-dominio-frontend.com
```

Generar JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (Vercel o `.env.local`)

```env
NEXT_PUBLIC_API_URL=https://tu-dominio-api.com/api/v1
```

---

## 2. Build y arranque

```bash
npm install
npm run prisma:generate -w api
npm run db:deploy
npm run db:seed          # solo primera vez
npm run build -w api
npm run build -w web
npm run start:prod -w api
npm run start -w web
```

---

## 3. Checklist antes de producción

- [ ] `JWT_SECRET` único y largo (≥ 32 chars)
- [ ] `NODE_ENV=production` en API
- [ ] `CORS_ORIGIN` apunta solo a tu dominio frontend
- [ ] HTTPS en frontend y API
- [ ] Cambiar contraseñas demo del seed
- [ ] Backup automático de BD
- [ ] Probar: login → POS → cobro → ticket → reporte

---

## 4. Backup de base de datos

```powershell
npm run db:backup
```

Archivos en `backups/restaurante_pos_YYYYMMDD-HHMMSS.sql`

Restaurar:

```powershell
Get-Content backups\archivo.sql | docker exec -i restaurante-postgres psql -U restaurante -d restaurante_pos
```

---

## 5. Zona horaria

`RESTAURANT_TIMEZONE` (default: `America/La_Paz`) controla pedidos del día, números #001 y reportes.

---

## 6. Health check

```bash
curl http://localhost:3001/api/v1/health
```

```json
{ "status": "ok", "database": "ok", "timezone": "America/La_Paz" }
```

---

## Vercel (frontend Next.js)

1. En el proyecto de Vercel → **Settings → General → Root Directory:** `apps/web`
2. **Environment variables** (Production):
   ```env
   NEXT_PUBLIC_API_URL=https://TU-API-PUBLICA/api/v1
   ```
   Debe ser la URL **HTTPS** de tu API (Railway/Render/VPS). Sin esto, login y menú no conectan.
3. El repo incluye `apps/web/vercel.json` (install desde monorepo) y `outputFileTracingRoot` en `next.config.ts`.
4. **Redeploy** tras cambiar variables (Redeploy → sin cache si sigue fallando).
5. La **API no va en Vercel**; despliégala aparte y configura `CORS_ORIGIN` con tu dominio `*.vercel.app` o dominio custom.

### Error 500 `FUNCTION_INVOCATION_FAILED`

- Confirma **Root Directory** = `apps/web`
- Revisa **Runtime Logs** en Vercel (Deployments → Functions / Logs)
- Variable `NEXT_PUBLIC_API_URL` definida y con `https://`
- API accesible: `curl https://tu-api/api/v1/health`

---

## 7. Problemas comunes

| Problema | Solución |
|----------|----------|
| Login falla | Verificar `CORS_ORIGIN` y `NEXT_PUBLIC_API_URL` |
| Reportes fecha incorrecta | Revisar `RESTAURANT_TIMEZONE` |
| Puerto 5432 ocupado (Windows) | Docker usa puerto **5433** |
| API no arranca | `JWT_SECRET` ≥ 32 caracteres en producción |
