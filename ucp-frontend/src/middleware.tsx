import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;

  const groups = (() => {
    try {
      return JSON.parse(request.cookies.get("groups")?.value ?? "[]");
    } catch {
      return [];
    }
  })();

  const { pathname } = request.nextUrl
  if (pathname.startsWith('/auth/login')) {
    return NextResponse.next()
  }

  if (path.startsWith("/personnel") && groups.includes("PUBLIC")) {
    const isEvaluationRoute =
      path.startsWith("/personnel/evaluation_offre") ||
      path.startsWith("/personnel/evaluation");
    if (!isEvaluationRoute) {
      return NextResponse.redirect(
        new URL("/procurement", request.url)
      );
    }
  }

  return NextResponse.next();
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
