import { NextRequest, NextResponse } from "next/server";
import { decryptAccess } from "./app/utils/access";
export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;

  const rawAccessType =
    request.cookies.get("access_type")?.value;
  const accessType = decryptAccess(rawAccessType);

  const token =
    request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/auth/login')) {
    return NextResponse.next()
  }
  if (
    path.startsWith("/admin") &&
    accessType !== "private"
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