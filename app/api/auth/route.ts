import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * In-memory rate limiter: max 5 failed attempts per IP per 15 minutes.
 * Per-instance on serverless, but still raises the cost of brute-forcing
 * a short PIN by orders of magnitude. Successful login clears the counter.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; first: number }>();

function isRateLimited(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
  // Bound the map so it cannot grow unbounded
  if (attempts.size > 10_000) attempts.clear();
}

/** Constant-time string comparison to prevent timing attacks on the PIN. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Твърде много опити. Опитайте отново след 15 минути." },
      { status: 429 }
    );
  }

  const { role, pin } = await req.json();

  if (typeof pin !== "string" || !pin) {
    recordFailure(ip);
    return NextResponse.json({ error: "Грешен PIN" }, { status: 401 });
  }

  if (role === "admin") {
    if (!process.env.ADMIN_PIN || !safeEqual(pin, process.env.ADMIN_PIN)) {
      recordFailure(ip);
      return NextResponse.json({ error: "Грешен PIN" }, { status: 401 });
    }
    attempts.delete(ip);
    return setSession(process.env.ADMIN_TOKEN ?? "");
  }

  if (role === "hub") {
    if (!process.env.HUB_PIN || !safeEqual(pin, process.env.HUB_PIN)) {
      recordFailure(ip);
      return NextResponse.json({ error: "Грешен PIN" }, { status: 401 });
    }
    attempts.delete(ip);
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
