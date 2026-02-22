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

  // NOTE: We intentionally do NOT redirect unauthenticated users from /dashboard.
  // Legacy users authenticate via Telegram ID stored in localStorage, which is
  // not accessible server-side. The client-side dashboard layout already handles
  // auth checking for both Supabase sessions and localStorage-based sessions.

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

  // Block access to /onboarding if already completed (server-side check for Supabase Auth users)
  if (user && request.nextUrl.pathname === "/onboarding") {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData } = await admin
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (userData?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)",
  ],
};
