import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure a row exists in the public users table for email-registered users
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingUser) {
        const meta = data.user.user_metadata || {};
        await supabaseAdmin.from("users").insert({
          id: data.user.id,
          first_name: meta.first_name || meta.name || "",
          email: data.user.email,
        });
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Redirect to login with error on failure
  return NextResponse.redirect(new URL("/?error=auth_callback_error", request.url));
}
