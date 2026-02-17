# Merge Create + Dashboard Plan

## Summary
Merge `/create` and `/dashboard` into a single authenticated `/dashboard` page. Simplify booth creation (no email fields). Restyle booth list with thumbnails. Add Projects teaser for Pro upsell with inactive Settings page.

## Changes

### 1. Auth: Add `plan` to session
- **`src/lib/auth.ts`**: Extend JWT/session callbacks to include user `plan`
- **`src/types/next-auth.d.ts`** (new): Type augmentation for plan in Session/JWT

### 2. API: Simplify POST /api/reactions
- **`src/app/api/reactions/route.ts`**: Require auth, use session email as senderEmail, make recipientEmail optional (default `""`), skip invite email when no recipientEmail

### 3. New components
- **`src/components/CreateBoothForm.tsx`** (new): Inline form — YouTube URL + optional intro message. Success banner stays until "Create another" is clicked. Calls `onCreated()` to refresh booth list.
- **`src/components/BoothCard.tsx`** (new): Card with YouTube thumbnail, overlaid status badge, title, date, copy-link button (for pending/opened), watch button (for completed)
- **`src/components/ProjectsTeaser.tsx`** (new): Pro teaser with blurred placeholder projects for free users, empty state for Pro users. Links to Project Settings page.

### 4. Dashboard page rewrite
- **`src/app/dashboard/page.tsx`**: Full rewrite composing CreateBoothForm + BoothCard grid + ProjectsTeaser

### 5. Project Settings (inactive)
- **`src/app/dashboard/projects/settings/page.tsx`** (new): All fields disabled, "Coming soon" banner. Shows: project name/description, brand color/logo, custom intro, layout selection grid.

### 6. Navigation + redirects
- **`src/components/Header.tsx`**: Remove standalone "Create" link, keep "Dashboard" only for authed users
- **`src/app/create/page.tsx`**: Replace with redirect to `/dashboard`
- **`src/app/page.tsx`**: Update CTA links from `/create` to `/dashboard`, update "How it works" step 2 copy

### 7. Cleanup
- Delete `src/components/CreateReactionForm.tsx`
