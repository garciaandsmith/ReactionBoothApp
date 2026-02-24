-- ReactionBooth initial schema migration
-- Run this in: Supabase → SQL Editor → New query → paste → Run
-- Generated from prisma/schema.prisma

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
  "id"            TEXT        NOT NULL,
  "email"         TEXT        NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  "name"          TEXT,
  "image"         TEXT,
  "passwordHash"  TEXT,
  "plan"          TEXT        NOT NULL DEFAULT 'free',
  "role"          TEXT        NOT NULL DEFAULT 'user',
  "status"        TEXT        NOT NULL DEFAULT 'pending',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- ─── OAuth Accounts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Account" (
  "id"                TEXT NOT NULL,
  "userId"            TEXT NOT NULL,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key"
  ON "Account"("provider", "providerAccountId");

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Session" (
  "id"           TEXT        NOT NULL,
  "sessionToken" TEXT        NOT NULL,
  "userId"       TEXT        NOT NULL,
  "expires"      TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

-- ─── Verification Tokens (magic-link / email sign-in) ─────────────────────────
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT        NOT NULL,
  "token"      TEXT        NOT NULL,
  "expires"    TIMESTAMPTZ NOT NULL,
  CONSTRAINT "VerificationToken_token_key" UNIQUE ("token"),
  CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
);

-- ─── Password Reset Tokens ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id"        TEXT        NOT NULL,
  "email"     TEXT        NOT NULL,
  "token"     TEXT        NOT NULL,
  "expires"   TIMESTAMPTZ NOT NULL,
  "used"      BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- ─── Site Settings (key/value store) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "key"       TEXT        NOT NULL,
  "value"     TEXT        NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("key")
);

-- ─── Projects (Pro feature) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Project" (
  "id"          TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "description" TEXT,
  "userId"      TEXT        NOT NULL,
  "brandColor"  TEXT                 DEFAULT '#6366f1',
  "brandLogo"   TEXT,
  "customIntro" TEXT,
  "layout"      TEXT        NOT NULL DEFAULT 'side-by-side',
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE
);

-- ─── Reactions (core entity) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Reaction" (
  "id"             TEXT        NOT NULL,
  "videoUrl"       TEXT        NOT NULL,
  "videoTitle"     TEXT,
  "senderEmail"    TEXT        NOT NULL,
  "recipientEmail" TEXT        NOT NULL,
  "senderId"       TEXT,
  "recipientId"    TEXT,
  "introMessage"   TEXT,
  "status"         TEXT        NOT NULL DEFAULT 'pending',
  "boothToken"     TEXT        NOT NULL,
  "recordingUrl"   TEXT,
  "composedUrl"    TEXT,
  "thumbnailUrl"   TEXT,
  "eventsUrl"      TEXT,
  "selectedLayout" TEXT,
  "downloadCount"  INTEGER     NOT NULL DEFAULT 0,
  "watermarked"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "maxVideoLength" INTEGER     NOT NULL DEFAULT 300,
  "expiresAt"      TIMESTAMPTZ NOT NULL,
  "openedAt"       TIMESTAMPTZ,
  "completedAt"    TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL,
  "projectId"      TEXT,
  CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Reaction_senderId_fkey" FOREIGN KEY ("senderId")
    REFERENCES "User"("id"),
  CONSTRAINT "Reaction_recipientId_fkey" FOREIGN KEY ("recipientId")
    REFERENCES "User"("id"),
  CONSTRAINT "Reaction_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Reaction_boothToken_key" ON "Reaction"("boothToken");

-- ─── Prisma migrations tracking table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    TEXT        NOT NULL,
  "checksum"              TEXT        NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        TEXT        NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count"   INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
