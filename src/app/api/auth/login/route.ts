import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: profile, error } = await supabase
      .from("forum_users")
      .select("id, username, email, gender, nexis_point, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

    if (!profile.password_hash) {
      return NextResponse.json(
        {
          error:
            "Bu hesap eski kayıt sistemiyle oluşturulmuş. Lütfen yeni bir hesap açın.",
        },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, profile.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

    const { password_hash: _, ...user } = profile;
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
