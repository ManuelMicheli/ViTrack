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
