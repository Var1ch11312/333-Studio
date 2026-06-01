import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { role, pin } = await req.json();

  if (role === "admin") {
    if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Грешен PIN" }, { status: 401 });
    }
    return setSession(process.env.ADMIN_TOKEN ?? "");
  }

  if (role === "hub") {
    if (!process.env.HUB_PIN || pin !== process.env.HUB_PIN) {
      return NextResponse.json({ error: "Грешен PIN" }, { status: 401 });
    }
    return setSession(process.env.HUB_TOKEN ?? "");
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("amur_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

function setSession(token: string) {
  if (!token) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("amur_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
