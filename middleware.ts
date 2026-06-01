import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("amur_session")?.value ?? "";
  const adminToken = process.env.ADMIN_TOKEN ?? "";
  const hubToken = process.env.HUB_TOKEN ?? "";

  const isAdmin = adminToken && session === adminToken;
  const isHub = hubToken && session === hubToken;

  if (pathname.startsWith("/admin") && !isAdmin) {
    return redirect(req, "admin");
  }

  if (pathname.startsWith("/hub") && !isAdmin && !isHub) {
    return redirect(req, "hub");
  }

  return NextResponse.next();
}

function redirect(req: NextRequest, role: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?role=${role}&next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/hub/:path*"],
};
