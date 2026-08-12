import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes that bypass the site password.
 *
 * `internet-contract-renewal` is unauthenticated so external Maze
 * participants can reach the A/B prototypes without a login wall. The prefix
 * deliberately covers both the Next routes (`/a`, `/b`) and the static files
 * they iframe (`/a.html`, `/b.html`) — gating the asset would leave the page
 * loading but the prototype blank. Every other route stays protected.
 */
const PUBLIC_PATHS = ["/experiments/internet-contract-renewal"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and auth API through unconditionally
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.cookies.get("site_session");
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos|icons|images|illustrations|fonts).*)"],
};
