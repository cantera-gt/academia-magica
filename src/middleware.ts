import { NextRequest, NextResponse } from "next/server";

const AFFILIATE_COOKIE = "am_aff";
const AFFILIATE_COOKIE_DAYS = 30;

export function middleware(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("aff");
  if (!raw) return NextResponse.next();

  const code = raw.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  if (!code) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set(AFFILIATE_COOKIE, code, {
    maxAge: 60 * 60 * 24 * AFFILIATE_COOKIE_DAYS,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/", "/matricula", "/matricula/:path*"],
};
