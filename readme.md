# ReactionBooth

Turn any YouTube link into a private reaction experience. Paste a link, send it to someone, and capture their genuine reaction — no editing skills required.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables and configure
cp .env.example .env

# Push database schema (requires a PostgreSQL database)
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import into Vercel
3. Add a **Vercel Postgres** database (or connect Neon/Supabase)
4. Add a **Vercel Blob** store
5. Set environment variables (see `.env.example`)
6. Deploy — `prisma generate` runs automatically via `postinstall`

## How It Works

1. **Paste a YouTube link** — any video you want someone to react to
2. **Enter emails** — yours and the recipient's
3. **Recipient opens their booth** — a private link with camera/mic recording
4. **Both get the video** — automatic email delivery when recording is done

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Prisma** with PostgreSQL for data
- **Vercel Blob** for video storage
- **NextAuth.js** for email magic-link authentication
- **MediaRecorder API** for browser-based webcam recording
- **Nodemailer** for email delivery

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/              # API routes (reactions, projects, auth)
│   ├── auth/             # Sign-in and verification pages
│   ├── booth/[token]/    # Reaction recording booth
│   ├── create/           # Create new reaction form
│   ├── dashboard/        # User dashboard
│   └── watch/[id]/       # Watch completed reactions
├── components/           # React components
│   ├── BoothExperience   # Full booth flow (welcome → record → upload → done)
│   ├── VideoRecorder     # Webcam recording with MediaRecorder
│   ├── YouTubePlayer     # YouTube embed with event handling
│   └── CreateReactionForm
└── lib/                  # Utilities
    ├── prisma.ts         # Database client
    ├── auth.ts           # NextAuth config
    ├── email.ts          # Email templates
    ├── youtube.ts        # YouTube URL parsing
    ├── rate-limit.ts     # Rate limiting for free tier
    └── constants.ts      # Plan configs
```

## Plans

| Feature | Free | Pro ($9/mo) |
|---------|------|-------------|
| Reactions/day | 3 | Unlimited |
| Max video length | 5 min | 30 min |
| Link lifespan | 7 days | 30 days |
| Watermark | Yes | No |
| Dashboard | — | Yes |
| Custom branding | — | Yes |
| Layout options | Side-by-side | All layouts |

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` — PostgreSQL connection string
- `DIRECT_DATABASE_URL` — Direct PostgreSQL connection (for pooled setups)
- `NEXTAUTH_SECRET` — Random secret for session encryption
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for video uploads
- `SMTP_*` — SMTP server credentials for email delivery
- `NEXT_PUBLIC_APP_URL` — Public URL of your deployment
