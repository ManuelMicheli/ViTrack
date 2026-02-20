# Multi-User Profiles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform ViTrack from single-user Telegram-ID login into a multi-user platform with Supabase Auth (email+password), extended profiles, and full personalization.

**Architecture:** Supabase Auth handles registration/login/sessions. A DB trigger syncs `auth.users` to the existing `users` table. The `users` table gets extended with profile fields (avatar, preferences, macro goals, etc.). Existing Telegram login remains as an alternative tab. All client components migrate from localStorage auth checks to `supabase.auth.getSession()`.

**Tech Stack:** Next.js 16, Supabase Auth (@supabase/ssr), React 19, Tailwind CSS v4, Supabase Storage (avatars)

**Validation:** No test framework configured. Validate every task with `npm run build`.

---

## Task 1: Install @supabase/ssr and create auth helpers

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase-browser.ts`
- Create: `src/lib/supabase-server.ts`

**Step 1: Install dependency**

```bash
npm install @supabase/ssr
```

**Step 2: Create browser auth client**

Create `src/lib/supabase-browser.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 3: Create server auth client**

Create `src/lib/supabase-server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

**Step 4: Validate build**

```bash
npm run build
```

Expected: Build succeeds. New files don't break anything.

**Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/supabase-browser.ts src/lib/supabase-server.ts
git commit -m "feat: add Supabase SSR auth helpers"
```

---

## Task 2: Create Next.js middleware for auth session refresh

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware**

Create `src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must be called to keep auth alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from /dashboard to login
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth pages to dashboard
  if (
    user &&
    (request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/register" ||
      request.nextUrl.pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
```

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for session refresh and route protection"
```

---

## Task 3: Database migration — extend users table + add trigger

**Files:**
- Create: `supabase/migrations/004_auth_profiles.sql`

**Step 1: Write migration SQL**

Create `supabase/migrations/004_auth_profiles.sql`:

```sql
-- Make telegram_id optional (new users register with email, not Telegram)
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;

-- Add profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'it' CHECK (language IN ('it', 'en'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS protein_goal INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS carbs_goal INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fat_goal INT;

-- Trigger: auto-create users row when someone registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

**Step 2: Run migration in Supabase SQL Editor**

Copy the SQL above and execute in Supabase Dashboard > SQL Editor.

**Step 3: Commit**

```bash
git add supabase/migrations/004_auth_profiles.sql
git commit -m "feat: migration to extend users table with profile fields and auth trigger"
```

---

## Task 4: Update TypeScript User interface

**Files:**
- Modify: `src/lib/types.ts` (lines 1-12)

**Step 1: Update User interface**

In `src/lib/types.ts`, replace lines 1-12:

```typescript
export interface User {
  id: string;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
  dietary_preferences: string[];
  avatar_url: string | null;
  theme: "dark" | "light" | "auto";
  unit_system: "metric" | "imperial";
  language: "it" | "en";
  notifications_enabled: boolean;
  daily_calorie_goal: number;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  water_goal_ml: number;
  water_tracking_mode: "glasses" | "ml";
  weight_goal_kg: number | null;
  height_cm: number | null;
  created_at: string;
}
```

**Step 2: Fix all TypeScript errors caused by the change**

Run `npm run build` and fix any errors. The main issues will be:
- `telegram_id` is now `number | null` — add null checks where `.telegram_id` is used
- New fields may cause issues in components that destructure User

Key files to check for `telegram_id` usage:
- `src/app/page.tsx` — login handler, already handles telegram flow
- `src/app/dashboard/layout.tsx:32` — fetches by telegram_id
- `src/app/dashboard/profile/page.tsx:96` — displays telegram_id
- `src/app/dashboard/settings/page.tsx:35` — fetches by telegram_id
- `src/components/ChatPanel.tsx:25` — reads from localStorage
- `src/app/api/telegram/webhook/route.ts` — Telegram webhook, always has telegram_id

**Step 3: Validate build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: extend User interface with profile and preference fields"
```

---

## Task 5: Update User API route to handle new fields

**Files:**
- Modify: `src/app/api/user/route.ts`

**Step 1: Expand GET handler to support id lookup**

Update the GET handler in `src/app/api/user/route.ts` to accept either `?telegram_id=X` or `?id=UUID`:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const telegramId = searchParams.get("telegram_id");
  const id = searchParams.get("id");

  if (!telegramId && !id) {
    return Response.json({ error: "telegram_id or id required" }, { status: 400 });
  }

  let query = supabaseAdmin.from("users").select("*");

  if (id) {
    query = query.eq("id", id);
  } else {
    query = query.eq("telegram_id", parseInt(telegramId!));
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(data);
}
```

**Step 2: Expand PATCH handler allowlist**

Update the allowed fields array in the PATCH handler:

```typescript
const allowedFields = [
  "first_name",
  "username",
  "email",
  "date_of_birth",
  "gender",
  "activity_level",
  "dietary_preferences",
  "avatar_url",
  "theme",
  "unit_system",
  "language",
  "notifications_enabled",
  "daily_calorie_goal",
  "protein_goal",
  "carbs_goal",
  "fat_goal",
  "water_goal_ml",
  "water_tracking_mode",
  "weight_goal_kg",
  "height_cm",
  "telegram_id",
];
```

**Step 3: Validate build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/api/user/route.ts
git commit -m "feat: extend user API with id lookup and new profile fields"
```

---

## Task 6: Create registration page

**Files:**
- Create: `src/app/register/page.tsx`

**Step 1: Create registration page**

Create `src/app/register/page.tsx` with a form containing:
- First name (text input)
- Email (email input)
- Password (password input, min 6 chars)
- Confirm password
- Submit button
- Link to login page

The form calls `supabase.auth.signUp()` with email, password, and `data: { first_name }`.
On success, redirect to `/dashboard`.

Use the same dark theme / glass-morphism style as the existing login page (`src/app/page.tsx`).

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/register/page.tsx
git commit -m "feat: add registration page with email/password signup"
```

---

## Task 7: Create forgot-password and reset-password pages

**Files:**
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/reset-password/page.tsx`

**Step 1: Create forgot-password page**

Create `src/app/forgot-password/page.tsx`:
- Email input field
- Submit button calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Success message: "Controlla la tua email per il link di reset"
- Link back to login

**Step 2: Create reset-password page**

Create `src/app/reset-password/page.tsx`:
- New password input (min 6 chars)
- Confirm password input
- Submit button calls `supabase.auth.updateUser({ password })`
- On success, redirect to `/dashboard`

Both pages use the same visual style as login/register.

**Step 3: Validate build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/forgot-password/page.tsx src/app/reset-password/page.tsx
git commit -m "feat: add forgot-password and reset-password pages"
```

---

## Task 8: Redesign login page with email + Telegram tabs

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Redesign login page**

Rewrite `src/app/page.tsx` with:
- Two tabs at the top: "Email" (default) and "Telegram ID"
- **Email tab:** email + password fields, calls `createSupabaseBrowser().auth.signInWithPassword({ email, password })`. On success redirect to `/dashboard`.
- **Telegram tab:** existing flow (numeric telegram_id input, calls `/api/user?telegram_id=X`, stores in localStorage). Keep backward compatibility.
- Link "Password dimenticata?" → `/forgot-password`
- Link "Non hai un account? Registrati" → `/register`
- Same visual style (dark theme, glass-morphism)

**Important:** For email login, after successful `signInWithPassword`, also fetch the user from `/api/user?id={session.user.id}` and store in localStorage for backward compatibility with components that still read localStorage.

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign login page with email and Telegram ID tabs"
```

---

## Task 9: Update dashboard layout to use Supabase Auth sessions

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: Update auth check**

Modify `src/app/dashboard/layout.tsx` to:
1. First try `createSupabaseBrowser().auth.getSession()` for email-authenticated users
2. If no Supabase session, fall back to localStorage check (for legacy Telegram-only users)
3. Fetch user via `/api/user?id={session.user.id}` for Supabase auth, or via `/api/user?telegram_id=X` for legacy

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const supabase = createSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // Email-authenticated user
      const res = await fetch(`/api/user?id=${session.user.id}`);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setAuthChecked(true);
        return;
      }
    }

    // Legacy: check localStorage for Telegram-only users
    const userId = localStorage.getItem("vitrack_user_id");
    const telegramId = localStorage.getItem("vitrack_telegram_id");

    if (!userId || !telegramId) {
      router.push("/");
      return;
    }

    const res = await fetch(`/api/user?telegram_id=${encodeURIComponent(telegramId)}`);
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
    } else {
      router.push("/");
      return;
    }
    setAuthChecked(true);
  };

  checkAuth();
}, [router]);
```

Update `handleLogout`:
```typescript
const handleLogout = async () => {
  const supabase = createSupabaseBrowser();
  await supabase.auth.signOut();
  localStorage.removeItem("vitrack_user_id");
  localStorage.removeItem("vitrack_telegram_id");
  router.push("/");
};
```

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: update dashboard layout to support Supabase Auth sessions"
```

---

## Task 10: Expand profile page with all new fields

**Files:**
- Modify: `src/app/dashboard/profile/page.tsx`

**Step 1: Expand profile page**

Update `src/app/dashboard/profile/page.tsx` to display and edit:

**Header section:**
- Avatar (large circle, shows image if `avatar_url` set, otherwise initials)
- Name and email display
- "Modifica Profilo" button

**Personal Info section:**
- Nome (first_name) — editable
- Email — read-only (from Supabase Auth)
- Data di nascita — date picker
- Sesso — select (Maschio/Femmina/Altro)
- Altezza — number input with unit (cm or in based on unit_system)
- Livello attivita — select

**Obiettivi section:**
- Calorie giornaliere — number input
- Proteine — number input (g)
- Carboidrati — number input (g)
- Grassi — number input (g)
- Obiettivo peso — number input
- Obiettivo acqua — number input (ml)

**Preferenze alimentari section:**
- Checkboxes: Vegano, Vegetariano, Celiaco, Intollerante al lattosio, Halal, Kosher

**Stats section (keep existing):**
- Giorni dall'iscrizione
- Obiettivo calorico
- Telegram ID (if linked)

Each section saves via `PATCH /api/user?id=${user.id}` with the updated fields.

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/dashboard/profile/page.tsx
git commit -m "feat: expand profile page with full personal info and goals"
```

---

## Task 11: Expand settings page with account, appearance, and data sections

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Step 1: Reorganize settings page into sections**

Update `src/app/dashboard/settings/page.tsx` with these sections:

**Account section:**
- Email (read-only display)
- Cambio password button → calls `supabase.auth.updateUser({ password })`  with a modal/inline form
- Collega Telegram — input field to enter Telegram ID, saves via PATCH `/api/user`
- Scollega Telegram — button to set telegram_id to null

**Aspetto section:**
- Tema: three-option selector (Scuro / Chiaro / Auto) — saves `theme` field
- Lingua: toggle (Italiano / English) — saves `language` field
- Unita di misura: toggle (Metrico kg/cm / Imperiale lbs/in) — saves `unit_system` field

**Notifiche section:**
- Toggle per attivare/disattivare notifiche — saves `notifications_enabled`

**Gestione Dati section (keep existing):**
- Reset pasti
- Reset allenamenti
- Reset tutto
- Export dati (JSON) — new, calls `GET /api/user/export?user_id={id}`

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: reorganize settings with account, appearance, and notification sections"
```

---

## Task 12: Add avatar upload API and Supabase Storage bucket

**Files:**
- Create: `src/app/api/user/avatar/route.ts`

**Step 1: Create avatar upload endpoint**

Create `src/app/api/user/avatar/route.ts`:

```typescript
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("avatar") as File;
  const userId = formData.get("user_id") as string;

  if (!file || !userId) {
    return Response.json({ error: "file and user_id required" }, { status: 400 });
  }

  // Validate file type and size
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return Response.json({ error: "File must be under 2MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `avatars/${userId}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Update user record
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ avatar_url: publicUrl });
}
```

**Note:** You must create an `avatars` bucket in Supabase Dashboard > Storage with public access enabled.

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/user/avatar/route.ts
git commit -m "feat: add avatar upload API endpoint with Supabase Storage"
```

---

## Task 13: Add data export API

**Files:**
- Create: `src/app/api/user/export/route.ts`

**Step 1: Create export endpoint**

Create `src/app/api/user/export/route.ts`:

```typescript
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return Response.json({ error: "user_id required" }, { status: 400 });
  }

  // Fetch all user data in parallel
  const [userRes, mealsRes, workoutsRes, waterRes, weightRes, chatRes] =
    await Promise.all([
      supabaseAdmin.from("users").select("*").eq("id", userId).single(),
      supabaseAdmin.from("meals").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supabaseAdmin.from("workouts").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supabaseAdmin.from("water_logs").select("*").eq("user_id", userId).order("date", { ascending: false }),
      supabaseAdmin.from("weight_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supabaseAdmin.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: userRes.data,
    meals: mealsRes.data || [],
    workouts: workoutsRes.data || [],
    water_logs: waterRes.data || [],
    weight_logs: weightRes.data || [],
    chat_messages: chatRes.data || [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vitrack-export-${userId}.json"`,
    },
  });
}
```

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/user/export/route.ts
git commit -m "feat: add user data export API endpoint"
```

---

## Task 14: Update Sidebar to show avatar image

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Update Sidebar avatar**

In `src/components/Sidebar.tsx`, update the user display section (around lines 72-85) to:
- Show `<img>` with `user.avatar_url` if available
- Fall back to gradient circle with initials if no avatar

```tsx
{user.avatar_url ? (
  <img
    src={user.avatar_url}
    alt={user.first_name || "Avatar"}
    className="w-8 h-8 rounded-full object-cover"
  />
) : (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
    {(user.first_name?.[0] || "U").toUpperCase()}
  </div>
)}
```

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: show user avatar image in sidebar when available"
```

---

## Task 15: Update ChatPanel to work with Supabase Auth

**Files:**
- Modify: `src/components/ChatPanel.tsx`

**Step 1: Update user_id resolution in ChatPanel**

In `src/components/ChatPanel.tsx`, update the user ID retrieval (around line 25-28) to:
1. First try Supabase Auth session
2. Fall back to localStorage

```typescript
const getUserId = async (): Promise<string | null> => {
  // Try Supabase Auth first
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) return session.user.id;

  // Fall back to localStorage
  return localStorage.getItem("vitrack_user_id");
};
```

Update the `useEffect` and `sendMessage` to use this async helper.

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat: update ChatPanel to support Supabase Auth sessions"
```

---

## Task 16: Update Telegram webhook to link with Supabase Auth users

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts`

**Step 1: Update handleStart function**

In the Telegram webhook, the `handleStart` function already upserts users by `telegram_id`. No major changes needed, but ensure the upsert doesn't conflict with the new nullable `telegram_id` constraint.

The existing flow:
- Telegram sends `/start` → webhook creates/updates user with `telegram_id`, `username`, `first_name`
- This user will have `email: null` (Telegram-only user)

Verify the upsert uses `ON CONFLICT (telegram_id)` which still works since `telegram_id` has a unique index.

**Step 2: Validate build**

```bash
npm run build
```

**Step 3: Commit (only if changes were needed)**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "fix: ensure Telegram webhook works with updated user schema"
```

---

## Task 17: Final integration validation

**Files:** None (validation only)

**Step 1: Full build validation**

```bash
npm run build
```

Expected: Build succeeds with zero errors.

**Step 2: Manual testing checklist**

Test these flows in order:

1. **New user registration:**
   - Go to `/register`
   - Enter name, email, password
   - Verify redirect to `/dashboard`
   - Verify user appears in Supabase `users` table

2. **Email login:**
   - Logout
   - Go to `/` → Email tab
   - Enter email + password
   - Verify redirect to `/dashboard`

3. **Telegram login (legacy):**
   - Go to `/` → Telegram ID tab
   - Enter existing Telegram ID
   - Verify redirect to `/dashboard`

4. **Profile editing:**
   - Go to `/dashboard/profile`
   - Edit name, date of birth, gender, goals
   - Verify changes persist after page refresh

5. **Avatar upload:**
   - Upload an image on profile page
   - Verify it shows in sidebar

6. **Settings:**
   - Change theme, language, unit system
   - Link/unlink Telegram
   - Change password
   - Export data

7. **Password reset:**
   - Go to `/forgot-password`
   - Enter email
   - Check email for reset link
   - Reset password via `/reset-password`

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes for multi-user auth system"
```

---

## Summary of all files

### New files (8):
- `src/lib/supabase-browser.ts` — Browser auth client
- `src/lib/supabase-server.ts` — Server auth client
- `src/middleware.ts` — Auth middleware
- `supabase/migrations/004_auth_profiles.sql` — Schema migration
- `src/app/register/page.tsx` — Registration page
- `src/app/forgot-password/page.tsx` — Forgot password page
- `src/app/reset-password/page.tsx` — Reset password page
- `src/app/api/user/avatar/route.ts` — Avatar upload API
- `src/app/api/user/export/route.ts` — Data export API

### Modified files (8):
- `src/lib/types.ts` — Extended User interface
- `src/app/page.tsx` — Redesigned login with tabs
- `src/app/api/user/route.ts` — Extended GET/PATCH
- `src/app/dashboard/layout.tsx` — Supabase Auth session check
- `src/app/dashboard/profile/page.tsx` — Full profile editing
- `src/app/dashboard/settings/page.tsx` — New sections
- `src/components/Sidebar.tsx` — Avatar image support
- `src/components/ChatPanel.tsx` — Auth-aware user ID
