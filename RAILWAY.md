# Despliegue de la API en Railway

## Por qué falló el build

Railway intentó “adivinar” el proyecto (Nixpacks) en un **monorepo** (`apps/api` + `apps/web`).  
Solo necesitas desplegar **`apps/api`**, no Next.js.

Usa el **Dockerfile** incluido en la raíz del repo.

---

## Pasos en Railway

### 1. Servicio API (no el de Next)

- **New** → **GitHub Repo** → tu repo.
- Si ya creaste un servicio que falla: **Settings** → borrar y crear uno nuevo, o reconfigurar.

### 2. Build

**Settings → Build:**

| Campo | Valor |
|--------|--------|
| **Builder** | Dockerfile |
| **Dockerfile path** | `Dockerfile.api` |
| **Root directory** | `/` (raíz del repo, vacío o `.`) |

Guarda y **Redeploy**.

### 3. Variables (Settings → Variables)

Obligatorias:

```env
NODE_ENV=production
DATABASE_URL=<Postgres: URL de Railway o Vercel Postgres>
JWT_SECRET=<mínimo 32 caracteres, NO uses "dev-secret" ni "cambiar">
JWT_EXPIRES_IN=8h
RESTAURANT_TIMEZONE=America/La_Paz
CORS_ORIGIN=https://TU-APP.vercel.app
API_PUBLIC_URL=https://TU-SERVICIO.up.railway.app
TRUST_PROXY=true
```

Generar JWT:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**No** uses `localhost` en `DATABASE_URL` ni `CORS_ORIGIN`.

### 4. Postgres

- Añade **PostgreSQL** en el mismo proyecto Railway **o** pega `DATABASE_URL` de Vercel Postgres.
- En el servicio API → **Variables** → referencia `${{Postgres.DATABASE_URL}}` si es Postgres de Railway.

### 5. Dominio público

**Settings → Networking → Generate domain**  
Copia la URL, ej. `https://something.up.railway.app`

Prueba:

`https://something.up.railway.app/api/v1/health`

### 6. Vercel (frontend)

```env
NEXT_PUBLIC_API_URL=/api/v1
API_BACKEND_URL=https://something.up.railway.app/api/v1
```

(o `NEXT_PUBLIC_API_URL=https://something.up.railway.app/api/v1` directo)

Redeploy Vercel.

---

## Si sigue fallando

**Deployments → View logs** del build. Errores típicos:

| Log | Solución |
|-----|----------|
| `JWT_SECRET` / producción | Variable JWT larga sin "cambiar" |
| `prisma` / migrate | Revisa `DATABASE_URL` |
| `npm ci` | Sube `package-lock.json` al repo |
| Dockerfile not found | Root = repo raíz, path = `Dockerfile.api` |

---

## Web en Railway

**No** despliegues `apps/web` en el mismo servicio que la API.  
Web → **Vercel**. API → **Railway** (este Dockerfile).
