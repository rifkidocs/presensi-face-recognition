import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/dashboard/login";
  const isDashboardPage = pathname.startsWith("/dashboard");
  const jwtToken = request.cookies.get("jwtToken");

  // Jika di halaman login dan sudah ada token, redirect ke dashboard
  if (isLoginPage && jwtToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Jika di halaman dashboard (selain login) dan tidak ada token, redirect ke login
  if (isDashboardPage && !isLoginPage && !jwtToken) {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }

  return NextResponse.next();
}

// Konfigurasi path yang akan diproses oleh middleware
export const config = {
  matcher: "/dashboard/:path*",
};
