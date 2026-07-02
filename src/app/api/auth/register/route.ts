import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createServerSupabase, mapAuthError } from "@/lib/auth-server";
import type { Gender } from "@/lib/types";

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const gender = body.gender as Gender;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı, e-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    if (gender !== "erkek" && gender !== "kadin") {
      return NextResponse.json(
        { error: "Geçerli bir cinsiyet seçin." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: emailExists } = await supabase
      .from("forum_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailExists) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kayıtlı." },
        { status: 409 }
      );
    }

    const { data: usernameExists } = await supabase
      .from("forum_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (usernameExists) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten alınmış." },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: profile, error } = await supabase
      .from("forum_users")
      .insert({
        username,
        email,
        gender,
        password_hash,
        nexis_point: 0,
      })
      .select("id, username, email, gender, nexis_point")
      .single();

    if (error || !profile) {
      const status = error?.code === "23505" ? 409 : 500;
      return NextResponse.json(
        {
          error: mapAuthError(
            status,
            error?.message ?? "Kayıt oluşturulamadı."
          ),
        },
        { status }
      );
    }

    return NextResponse.json({ user: profile });
  } catch {
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
