# Security Configuration

This document describes the security features configured for the HRMS Suite application.

## 1. Session Expiry (24 hours)

Login sessions are short-lived by design.

- **JWT session strategy** with a hard `maxAge` of **24 hours** (`24 * 60 * 60` seconds).
- Configured in `src/auth.ts:27` via `session: { strategy: "jwt", maxAge: 24 * 60 * 60 }`.
- The same value is mirrored in the `SESSION_MAX_AGE` environment variable (`86400`).
- After expiry, the user is redirected to `/login` automatically because the middleware no longer recognizes the session cookie.

> To change the expiry, update the `maxAge` in `src/auth.ts` and the `SESSION_MAX_AGE` env var together.

## 2. Secure Cookies

- The session cookie is named `__Secure-authjs.session-token` (the `__Secure-` prefix enforces HTTPS).
- `httpOnly: true` prevents client-side JavaScript from reading the token.
- `sameSite: "lax"` mitigates CSRF on top-level navigations.
- `secure` is enabled automatically in production (`NODE_ENV === "production"`).

## 3. HTTPS / SSL Redirect

- In production, the middleware (`src/middleware.ts`) redirects `http://` → `https://` with a `308` status.
- The redirect only fires when `NODE_ENV === "production"` so local development keeps working.

### Provisioning an SSL certificate

**Railway**
1. In your Railway project, open the **Domains** tab.
2. Add your custom domain (e.g. `hrms.yourcompany.com`).
3. Railway provisions a free **Let's Encrypt** certificate automatically and forces HTTPS.
4. Set `AUTH_URL` to the `https://` domain.

**Vercel**
1. Add a custom domain in the Vercel project settings.
2. Vercel issues a free Let's Encrypt certificate automatically.
3. All traffic is redirected to HTTPS by default.

**Self-hosted (nginx / Caddy / Docker)**
1. Obtain a certificate from Let's Encrypt:
   ```bash
   sudo certbot --nginx -d hrms.yourcompany.com
   ```
2. Ensure the upstream app runs on `http://localhost:3000` and nginx terminates TLS.
3. Set `NODE_ENV=production` so the middleware enforces the HTTPS redirect.

**Local development**
- Run with `npm run dev` over plain HTTP. The redirect is skipped because `NODE_ENV` is `development`.

## 5. Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `AUTH_SECRET` | Yes | Random secret for JWT signing |
| `AUTH_URL` | Yes | Must be `https://` in production |
| `SESSION_MAX_AGE` | No | Mirrors the 24h JWT max age |
| `NODE_ENV` | Yes | Set to `production` in deployment |

## 6. Hardening Checklist

- [ ] `AUTH_SECRET` is a random, non-default value in production.
- [ ] `AUTH_URL` uses `https://`.
- [ ] Database credentials are not committed to version control.
- [ ] `uploads/` directory is outside the web root or served behind authentication.
- [ ] Prisma migrations are applied before the first request (`npm run db:migrate` / `db:push`).