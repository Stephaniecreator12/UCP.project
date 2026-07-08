import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;

  const group =
    request.cookies.get("group")?.value;

  const { pathname } = request.nextUrl
  if (pathname.startsWith('/auth/login')) {
    return NextResponse.next()
  }
  if (
    path.startsWith("/personnel") &&
    group == "public"
  ) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }
  return NextResponse.next();
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}