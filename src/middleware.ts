import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname === "/login" || pathname === "/api/auth/login" || pathname.startsWith("/api/cron")) return NextResponse.next();

  const token = req.cookies.get("session")?.value;
  if (!token || !process.env.AUTH_SECRET) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=session", req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!login|api/auth/login|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
