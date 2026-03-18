-- ─────────────────────────────────────────────────────────────────────────────
-- ReactionBooth v2 — Layout Styles table
-- Run this in: Supabase → SQL Editor → New query → paste → Run
--
-- This is an INCREMENTAL migration. Run it if you already have the base
-- tables from supabase-migration.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Layout Styles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LayoutStyle" (
  "id"           TEXT        NOT NULL,
  "name"         TEXT        NOT NULL,
  "isDefault"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "bgPip"        TEXT,
  "bgSideBySide" TEXT,
  "bgStacked"    TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "LayoutStyle_pkey" PRIMARY KEY ("id")
);
