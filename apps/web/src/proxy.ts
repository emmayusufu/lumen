import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  if (!req.cookies.get("token")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/w/:path*", "/settings/:path*", "/docs/:path*"],
};
