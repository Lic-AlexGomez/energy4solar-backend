# Energy4Solar Backend

Production backend for [Energy4Solar](https://www.energy4solar.com): Zoho Books product sync, REST APIs, affiliate click tracking, and admin tools.

Energy4Solar is an **affiliate platform** — customers never checkout here. Products sync from Zoho Books; purchases happen on BigBattery.

## Stack

- Next.js 16 App Router (Route Handlers + RSC)
- TypeScript (strict)
- Prisma ORM + PostgreSQL (Supabase)
- Zod validation
- Vercel Cron (15-minute sync)
- TanStack Query compatible JSON (`{ data, meta? }`)

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/Lic-AlexGomez/energy4solar-backend.git
cd energy4solar-backend
npm install
```

### 2. Supabase database

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the **Connection pooling** URL → `DATABASE_URL`
3. Copy the **Direct** URL → `DIRECT_URL` (for migrations)

```bash
cp .env.example .env
# Edit .env with your values
npm run db:push
```

### 3. Zoho Books credentials

Create a Zoho API client (Server-based) with Books scope. Add to `.env`:

| Variable | Description |
|----------|-------------|
| `ZOHO_CLIENT_ID` | OAuth client ID |
| `ZOHO_CLIENT_SECRET` | OAuth client secret |
| `ZOHO_REFRESH_TOKEN` | Long-lived refresh token |
| `ZOHO_ORGANIZATION_ID` | Books org ID |

Never expose these to the frontend.

### 4. Run locally

```bash
npm run dev
# API: http://localhost:3001
# Admin: http://localhost:3001/admin
```

Manual sync:

```bash
npm run sync
```

## Deploy to Vercel

1. Import repo `Lic-AlexGomez/energy4solar-backend`
2. Set all env vars from `.env.example`
3. Set `CRON_SECRET` (Vercel sends `Authorization: Bearer <secret>`)
4. Set `ADMIN_API_KEY` for admin login and `POST /api/admin/sync`
5. Set `CORS_ORIGINS=https://www.energy4solar.com`

Cron is configured in `vercel.json` → `GET /api/cron/sync` every 15 minutes.

### Recommended architecture

| Service | URL |
|---------|-----|
| Frontend | `https://www.energy4solar.com` (energy4solar-j0) |
| Backend API | `https://api.energy4solar.com` or Vercel subdomain |

Point frontend `NEXT_PUBLIC_API_URL` to the backend URL.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | Cursor-paginated products |
| GET | `/api/products/:slug` | Product detail |
| GET | `/api/categories` | Categories |
| GET | `/api/brands` | Brands |
| GET | `/api/search?q=` | Full-text search |
| GET | `/api/compare?ids=` | Compare products |
| POST | `/api/finder` | Battery finder recommendations |
| POST | `/api/affiliate-click` | Record click, return redirect URL |
| GET | `/api/r/:slug` | **302 redirect** to BigBattery + analytics |
| GET | `/api/guides` | Published guides |
| GET | `/api/guides/:slug` | Guide detail |
| POST | `/api/admin/sync` | Force sync (requires `x-admin-key`) |
| GET | `/api/cron/sync` | Cron sync (requires `Authorization: Bearer CRON_SECRET`) |

### Pagination

```
GET /api/products?limit=24&cursor=<productId>&category=lifepo4&sort=price-asc
```

Response:

```json
{
  "data": [/* products */],
  "meta": { "hasMore": true, "nextCursor": "clx...", "limit": 24 }
}
```

### Affiliate redirect

Use `GET /api/r/{product-slug}` for server-side 302 redirects with UTM params:

```
/api/r/12v-100ah-lifepo4?utm_source=energy4solar&utm_campaign=pdp
```

## Admin dashboard

`/admin` — sync logs, force sync, affiliate analytics, SEO overrides, buying guides.

Login with `ADMIN_API_KEY`. In development without a key, admin is open.

## Project structure

```
app/api/          Route handlers
app/admin/        Admin UI
src/modules/      Domain services (zoho, sync, products, affiliate)
src/lib/          Prisma, logging, errors, auth
src/schemas/      Zod validation
prisma/           Database schema
scripts/          CLI sync
```

## Frontend integration

In `energy4solar-j0`, set:

```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

Replace mock `lib/ecommerce/products.ts` with fetches to `/api/products`. Use TanStack Query with `src/lib/query.ts` patterns.

Affiliate CTA should link to:

```
${NEXT_PUBLIC_API_URL}/api/r/${product.slug}?utm_source=energy4solar&utm_medium=affiliate&utm_campaign=pdp
```

## License

Private — Energy4Solar
