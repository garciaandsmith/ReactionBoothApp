# Deployment Guide — ReactionBooth

This guide covers deploying ReactionBooth to **Vercel** for public testing.
The stack (Vercel + Neon + Vercel Blob) is identical to the recommended production infrastructure.

---

## Services needed (all have free tiers)

| Service | Purpose | Free tier |
|---------|---------|-----------|
| [Vercel](https://vercel.com) | Hosts the Next.js app | Yes — Hobby plan |
| [Neon](https://neon.tech) | Serverless PostgreSQL | Yes — 0.5 GB storage |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Video file storage | Yes — 1 GB |
| [Resend](https://resend.com) or [Brevo](https://brevo.com) | SMTP for emails | Yes |

---

## Step-by-step

### 1. Push the code to GitHub

```bash
git push -u origin main
```

### 2. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project → copy the **Connection string** (Pooled)
3. Also copy the **Direct URL** (needed for Prisma migrations)

### 3. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**
2. Select your GitHub repo
3. Leave all build settings as defaults (Vercel auto-detects Next.js)
4. Click **Deploy** — it will fail on the first deploy because env vars aren't set yet. That's fine.

### 4. Add Vercel Blob storage

1. In your Vercel project dashboard → **Storage** tab → **Create** → **Blob**
2. Name it anything (e.g. `reactionbooth-blob`)
3. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your environment

### 5. Set environment variables

In Vercel project → **Settings** → **Environment Variables**, add:

```
DATABASE_URL          postgresql://...   (Neon pooled connection string)
DIRECT_DATABASE_URL   postgresql://...   (Neon direct connection string)
NEXTAUTH_SECRET       <run: openssl rand -base64 32>
NEXTAUTH_URL          https://your-app.vercel.app
NEXT_PUBLIC_APP_URL   https://your-app.vercel.app
SMTP_HOST             smtp.resend.com
SMTP_PORT             587
SMTP_USER             resend
SMTP_PASS             re_xxxxxxxxxxxx    (from Resend dashboard)
EMAIL_FROM            ReactionBooth <noreply@yourdomain.com>
```

> `BLOB_READ_WRITE_TOKEN` is added automatically by Vercel Blob.

### 6. Run the database migration

In your local terminal (with the same `DATABASE_URL` set):

```bash
npx prisma migrate deploy
# or for a fresh schema push:
npx prisma db push
```

Alternatively, add this as a build command override in Vercel:
`prisma migrate deploy && next build`

### 7. Redeploy

Trigger a new deployment in Vercel (or push any commit). The app will now be live.

### 8. Create the first admin user

After deployment, sign up normally via `/auth/signin`, then run in Prisma Studio
or your DB console:

```sql
UPDATE "User" SET role = 'admin', status = 'active' WHERE email = 'your@email.com';
```

---

## Maintenance mode (start / stop)

The admin panel includes a **Maintenance Mode** toggle at `/admin/settings`.

- **ON** → Home page shows a "We'll be right back" message. New reaction creation is blocked (API returns 503). Existing booth links and the admin panel remain accessible.
- **OFF** → Site is fully live.

Use this to control costs: turn ON when you're done testing, turn OFF when you want testers to interact.

---

## Cost control tips

| Scenario | Action |
|----------|--------|
| Done for the day | Turn ON maintenance mode via admin panel |
| Want to pause all DB writes | Turn ON maintenance mode |
| Completely suspend | Pause the Neon project from Neon dashboard (free tier auto-suspends after 5 min inactivity) |
| Remove video storage | Delete blobs from Vercel Blob dashboard |

Vercel Hobby plan has **no monthly cost** — you only pay if you exceed generous free limits.
Neon free tier **auto-suspends** the database after 5 minutes of inactivity — zero cost when idle.

---

## Architecture overview

```
Browser → Vercel Edge Network
             ↓
         Next.js (Vercel Serverless Functions)
             ↓                    ↓
         Neon PostgreSQL    Vercel Blob Storage
         (via Prisma)       (video files)
             ↓
         SMTP (Resend/Brevo)
         (email notifications)
```

This matches the recommended production architecture — the only differences in production would be:
- Vercel Pro plan (higher function timeouts, more bandwidth)
- Custom domain
- Paid Neon plan (more storage, no auto-suspend)
