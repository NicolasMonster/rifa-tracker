# 🎟️ Rifa Tracker

Dashboard para trackear métricas diarias de tu negocio de rifas con integración automática a Meta Ads.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (base de datos PostgreSQL)
- **Vercel** (deploy)
- **Meta Ads API** (gasto automático)

---

## Setup paso a paso

### 1. Clonar y subir a GitHub

```bash
git init
git add .
git commit -m "init rifa tracker"
# Crear repo en github.com y conectarlo:
git remote add origin https://github.com/TU_USUARIO/rifa-tracker.git
git push -u origin main
```

### 2. Configurar Supabase

1. Entrá a [supabase.com](https://supabase.com) → New project
2. Anotá la **URL** y **anon key** de Settings → API
3. En el SQL Editor, corré el contenido de `supabase/migrations/001_init.sql`

### 3. Obtener token de Meta

1. Andá a [developers.facebook.com](https://developers.facebook.com)
2. Creá una app → Business → Meta Ads
3. Generá un **Long-Lived Access Token** con permiso `ads_read`
4. Tu **Ad Account ID** lo encontrás en Meta Ads Manager → Settings (formato: `act_XXXXXXXXX`)

### 4. Deploy en Vercel

1. Entrá a [vercel.com](https://vercel.com) → New Project → importá tu repo de GitHub
2. En **Environment Variables** agregá:

```
NEXT_PUBLIC_SUPABASE_URL       = https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJhbGci...
META_ACCESS_TOKEN               = EAAxxxxxx...
META_AD_ACCOUNT_ID              = act_XXXXXXXXX
```

3. Deploy → listo ✅

### 5. Desarrollo local

```bash
cp .env.local.example .env.local
# Rellenar las variables en .env.local
npm install
npm run dev
# Abrir http://localhost:3000
```

---

## Cómo usar

1. Cada día, abrís la app
2. Seleccionás la fecha → click **"Traer datos"** → Meta carga el gasto automáticamente
3. Ingresás manualmente el **monto generado** y las **rifas vendidas**
4. Guardás → el ROAS, ganancia neta y CPA se calculan solos

---

## Métricas incluidas

| Métrica | Fuente |
|---------|--------|
| Gasto | Meta API (auto) |
| Impresiones | Meta API (auto) |
| Clics | Meta API (auto) |
| Alcance | Meta API (auto) |
| CPM | Meta API (auto) |
| CTR | Meta API (auto) |
| Generado | Manual |
| Rifas vendidas | Manual |
| ROAS | Calculado |
| Ganancia neta | Calculado |
| CPA | Calculado |
