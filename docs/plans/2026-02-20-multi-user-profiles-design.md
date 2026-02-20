# Multi-User Profiles Design

**Date**: 2026-02-20
**Status**: Approved

## Overview

Transform ViTrack from a single-user Telegram-ID-based app into a multi-user platform with email+password registration via Supabase Auth, extended user profiles, and full personalization.

## Approach

**Supabase Auth native** — use `supabase.auth.signUp()` / `signInWithPassword()` for email+password authentication. Existing Telegram ID login remains as an alternative path. Users can optionally link their Telegram account.

## Authentication

### Registration (`/register`)
- Form: email, password, confirm password, first name
- `supabase.auth.signUp({ email, password, options: { data: { first_name } } })`
- DB trigger `on_auth_user_created` auto-creates `users` row with `id = auth.users.id`
- Optional email confirmation (configurable in Supabase Dashboard)

### Login (`/` — redesigned)
- Two tabs: "Email" and "Telegram ID"
- Email tab: `supabase.auth.signInWithPassword({ email, password })`
- Telegram tab: existing flow (numeric ID entry)
- "Forgot password?" link → `supabase.auth.resetPasswordForEmail()`
- "No account? Register" link → `/register`

### Session Management
- Supabase handles JWT via cookies/localStorage automatically
- Dashboard layout checks `supabase.auth.getSession()` instead of manual localStorage
- Logout: `supabase.auth.signOut()`

### Telegram Linking (optional, from Settings)
- User enters Telegram ID in settings
- System verifies existence and links data

## Extended User Profile Schema

New columns added to `users` table:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `email` | TEXT | null | User email (from Supabase Auth) |
| `date_of_birth` | DATE | null | Date of birth |
| `gender` | TEXT | null | `male`, `female`, `other` |
| `activity_level` | TEXT | `'moderate'` | `sedentary`, `light`, `moderate`, `active`, `very_active` |
| `dietary_preferences` | TEXT[] | `'{}'` | Array: `vegano`, `vegetariano`, `celiaco`, `lattosio`, `halal`, etc. |
| `avatar_url` | TEXT | null | Profile image URL (Supabase Storage) |
| `theme` | TEXT | `'dark'` | `dark`, `light`, `auto` |
| `unit_system` | TEXT | `'metric'` | `metric` (kg/cm), `imperial` (lbs/in) |
| `language` | TEXT | `'it'` | `it`, `en` |
| `notifications_enabled` | BOOLEAN | true | Notifications toggle |
| `protein_goal` | INT | null | Daily protein goal (g) |
| `carbs_goal` | INT | null | Daily carbs goal (g) |
| `fat_goal` | INT | null | Daily fat goal (g) |

**Key change**: `telegram_id` becomes nullable (not all users will have Telegram).

## Frontend Pages

### New Pages
1. `/register` — Registration form (email, password, name)
2. `/forgot-password` — Enter email for password reset
3. `/reset-password` — Set new password (from email link)

### Modified Pages
4. `/` (Login) — Redesigned with two tabs (Email / Telegram ID), links to register and forgot password
5. `/dashboard/profile` — Expanded with all new profile fields: avatar, personal data, dietary preferences, macro goals
6. `/dashboard/settings` — Reorganized into sections:
   - **Account**: email, change password, link/unlink Telegram
   - **Appearance**: theme (dark/light/auto), language, unit system
   - **Notifications**: toggle
   - **Data**: export data (JSON/CSV), reset data (existing)

### Dashboard Layout
- Sidebar shows avatar + name (profile photo if available)
- Session check uses `supabase.auth.getSession()`

## Data Flow

### Registration Flow
```
/register → supabase.auth.signUp() → Supabase creates auth.users
  → DB trigger on_auth_user_created → INSERT INTO users (id, email, first_name)
  → Redirect to /dashboard
```

### Email Login Flow
```
/ (email tab) → supabase.auth.signInWithPassword() → JWT session
  → /dashboard/layout.tsx checks getSession()
  → Load user from users table (WHERE id = auth.uid())
```

### Telegram Login Flow (legacy)
```
/ (telegram tab) → GET /api/user?telegram_id=X → find user
  → supabase.auth.signInWithPassword() (if linked) OR localStorage (fallback)
```

## API Changes

- **`GET /api/user`**: accepts `?id=UUID` in addition to `?telegram_id=X`
- **`PATCH /api/user`**: accepts all new profile fields
- **`POST /api/user/avatar`**: upload avatar to Supabase Storage, save URL
- **`POST /api/user/export`**: generate JSON/CSV with all user data

## RLS Updates

- Policies updated to use `auth.uid()` as primary identity source
- Backend (service_role) continues to bypass RLS

## Migration Strategy

- Existing Telegram-only users continue to work unchanged
- They can optionally create an email account and link their Telegram ID
- No forced migration
