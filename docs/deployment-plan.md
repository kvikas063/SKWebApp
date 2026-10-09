# Deployment Plan: Frontend + Backend Separation

## Architecture

```
┌─────────────────┐     HTTP + JWT     ┌──────────────────┐
│   Frontend      │◄──────────────────►│   Backend API    │
│  (Next.js 16)   │                     │  (Hono + Node)   │
│  Port: 3000     │                     │  Port: 4000      │
└─────────────────┘                     └──────────────────┘
         │                                      │
         │ WebSocket / Server Events            │ PostgreSQL
         │                                      │
    ┌────┴────┐                            ┌────┴────┐
    │ Vercel  │                            │ Railway │
    └─────────┘                            └─────────┘
```

## Services

| Service | Tech | Port | Host |
|---------|------|------|------|
| Frontend | Next.js 16 App Router | 3000 | Vercel |
| Backend API | Hono + Node.js | 4000 | Railway / Render / Fly.io |
| Database | PostgreSQL | 5432 | Railway / Supabase / RDS |

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_SECRET=your-secret-here
NODE_ENV=production
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=HRMS <noreply@yourdomain.com>
FRONTEND_URL=https://yourdomain.com
PORT=4000
NODE_ENV=production
```

## Deployment Steps

### 1. Backend (Railway)
```bash
cd backend-api
railway login
railway up
```

Or use Docker:
```bash
cd backend-api
docker build -t sk-webapp-backend .
docker run -d -p 4000:4000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e RESEND_API_KEY="..." \
  -e FRONTEND_URL="https://yourdomain.com" \
  sk-webapp-backend
```

### 2. Database
```bash
railway postgres
# Or connect to existing Supabase/RDS
```

### 3. Frontend (Vercel)
```bash
cd frontend
vercel login
vercel --prod
```

### 4. Verify
```bash
curl https://api.yourdomain.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

## CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy Backend
on:
  push:
    paths:
      - 'backend-api/**'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: railway/action@v1
        with:
          railwayToken: ${{ secrets.RAILWAY_TOKEN }}
```

## Rollback Strategy

### Backend
```bash
railway rollback
```

### Frontend
```bash
vercel rollback --yes
```

## Monitoring

### Health Checks
- `GET /health` — Backend API
- `GET /` — Frontend (200 OK)

### Logging
- Backend: `npm run start` → stdout
- Frontend: Vercel Analytics
- Database: Railway Logs

## Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | Yes (Hobby) | $20/mo Pro |
| Railway | Yes (Hobby) | $5/mo Starter |
| PostgreSQL | Yes (Hobby) | $5/mo Starter |
| **Total** | **$0** | **$30/mo** |

## Free-Tier Options

All three services offer generous free tiers that work for this project:

### Vercel (Frontend)
- **Free**: Hobby plan
- Unlimited projects, 100GB bandwidth
- Custom domain included
- Global CDN
- `vercel --prod` deploys for free

### Railway (Backend)
- **Free**: Hobby plan
- $5 credit per month
- 512MB RAM, 1 CPU
- Custom domain included
- `railway up` deploys for free

### PostgreSQL
- **Free**: Railway PostgreSQL
- 100MB storage
- Included with Railway Hobby plan
- No separate cost

### Alternative: Render
- **Free**: Starter plan
- $0/month (no credit card needed)
- 512MB RAM, 0.5 CPU
- 750GB bandwidth
- PostgreSQL included
- `render.com` — deploy with `render.yaml`

### Alternative: Fly.io
- **Free**: 3 machines, 256MB RAM each
- $0/month (no credit card needed)
- Global edge deployment
- `fly launch` — one command deploy

### All-Free Stack
```
Frontend:    Vercel Hobby (free)
Backend API: Render Starter (free)
Database:    Render PostgreSQL (free)
Total:       $0/month
```

### Quick Deploy Commands
```bash
# Backend (Render)
render deploy --service sk-webapp-backend

# Backend (Railway)
cd backend-api && railway up

# Backend (Fly.io)
cd backend-api && fly launch

# Frontend (Vercel)
cd frontend && vercel --prod