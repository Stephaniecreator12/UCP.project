import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;

  const accessType =
    request.cookies.get("access_type")?.value;

  const token =
    request.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
  }
  /*
  if (
    path.startsWith("/admin") &&
    accessType !== "private"
  ) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }
  */
  return NextResponse.next();
}
