# Deploying ReactionBooth to Production

Stack: **Vercel** (hosting) · **Supabase** (PostgreSQL) · **Vercel Blob** (video storage) · **Resend** (email)

This is the recommended definitive infrastructure. Everything set up here is production-grade; no changes will be needed when moving from testing to full launch.

---

## Prerequisites

- GitHub account (repo already pushed)
- Vercel account connected to GitHub → [vercel.com](https://vercel.com)
- Supabase account → [supabase.com](https://supabase.com)
- Resend account → [resend.com](https://resend.com)

---

## 1. Supabase — Create the Database

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `reactionbooth`), pick a region close to your users, set a strong DB password → **Create project**
3. Wait ~1 minute for provisioning

### Get the two connection strings

Go to **Project Settings → Database → Connection string**

| Mode | Port | Used for |
|------|------|----------|
| **Transaction** (pooler) | 6543 | `DATABASE_URL` — app runtime queries |
| **Session / Direct** | 5432 | `DIRECT_URL` — Prisma migrations |

Copy both URIs and keep them handy. They look like:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Add `?pgbouncer=true` to the end of the **Transaction** (port 6543) URL.

---

## 2. Resend — Set Up Email

1. Go to [resend.com](https://resend.com) → **API Keys → Add API Key** → copy the key (`re_...`)
2. **For testing (no domain needed):** use `onboarding@resend.dev` as the sender — emails only deliver to your own verified address
3. **For real use:** go to **Domains → Add Domain**, add a DNS TXT record, verify it, then use `noreply@yourdomain.com`

---

## 3. Vercel — Import and Configure the Project

### 3a. Import from GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select the **garciaandsmith/ReactionBoothApp** repository → **Import**
3. Leave the framework preset as **Next.js** (auto-detected)
4. **Do not deploy yet** — set env vars first (next step)

### 3b. Add environment variables

In the Vercel project → **Settings → Environment Variables**, add each variable below.
Apply all to **Production**, **Preview**, and **Development** unless noted.

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase Transaction pooler URL (port 6543, append `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection URL (port 5432) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` locally and paste the result |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (update after first deploy) |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | Your Resend API key (`re_...`) |
| `EMAIL_FROM` | `ReactionBooth <noreply@yourdomain.com>` (or `onboarding@resend.dev` for testing) |

### 3c. Add Vercel Blob Storage

1. Vercel project → **Storage → Create Store → Blob**
2. Name it (e.g. `reactionbooth-videos`) → **Create**
3. Click **Connect to project** — this auto-adds `BLOB_READ_WRITE_TOKEN` to your env vars

### 3d. Deploy

Click **Deploy** (or push a commit to trigger it). The build runs:
```
prisma generate && next build
```
Both should succeed.

---

## 4. Run the Database Migration

After the first deploy, run the schema migration **once** from your local machine:

```bash
# In your local project directory
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, and NEXTAUTH_SECRET in .env.local

npx prisma migrate deploy
# or if you haven't created migrations yet:
npx prisma db push
```

This creates all tables in Supabase. You can verify in **Supabase → Table Editor**.

---

## 5. Create the First Admin User

After migration, register an account through the app, then promote it to admin directly in Supabase:

1. Go to your deployed app → sign up with your email
2. In **Supabase → Table Editor → User** table, find your row
3. Set `role` = `admin` and `status` = `active` → **Save**

You can now access `/admin` and manage the site.

---

## 6. Update the Domain in Vercel

After your first deploy you'll have a URL like `https://reactionbooth-xxx.vercel.app`.

1. Go to **Vercel → Settings → Environment Variables**
2. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your actual URL
3. Trigger a redeploy (push any commit, or **Vercel → Deployments → Redeploy**)

For a custom domain: **Vercel → Settings → Domains → Add**.

---

## 7. Start / Stop — Maintenance Mode

The admin panel at `/admin/settings` has a **Maintenance Mode** toggle.

| State | Effect |
|-------|--------|
| **OFF** (default) | Site is live and accepting visitors |
| **ON** | Home page shows "We'll be right back". New reaction creation is blocked (API returns 503). Existing booth links and `/admin` remain accessible. |

**To pause the site:** sign in as admin → `/admin/settings` → **Turn ON (pause site)**

**To resume:** same page → **Turn OFF (go live)**

This is the cost-control mechanism — turn it on between testing sessions to prevent unexpected usage on free-tier limits.

---

## 8. Invite Beta Testers

Once the site is live:

1. Turn **Maintenance Mode OFF**
2. Share your Vercel URL with testers
3. New signups start with `status = pending` (requires admin approval)
4. Go to `/admin/users` to review and **Approve** each tester
5. Approved users get `status = active` and can use the app

To skip approval for trusted testers, set their `status` to `active` directly in Supabase.

---

## Architecture Overview

```
Browser
  └── Vercel (Next.js — serverless functions + static assets)
        ├── Supabase PostgreSQL  (database via Prisma)
        ├── Vercel Blob          (video file storage)
        └── Resend / SMTP        (transactional email)
```

This is also the recommended final production architecture. Nothing needs to change when moving from beta to launch.

---

## Useful Commands (local)

```bash
# View DB with GUI
npx prisma studio

# Push schema changes (skips migration history — OK for early dev)
npx prisma db push

# Create and apply a proper migration
npx prisma migrate dev --name describe-your-change

# Apply pending migrations in production (run after deploy)
npx prisma migrate deploy
```
