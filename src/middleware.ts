import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/study"];
const authRoutes = ["/auth/login", "/auth/signup"];

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    
    const isProtectedRoute = protectedRoutes.some(route => 
        nextUrl.pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some(route => 
        nextUrl.pathname === route
    );

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", nextUrl));
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/study/:path*",
        "/auth/:path*",
    ],
};

// Force Node.js runtime - Edge doesn't support Prisma/SQLite
export const runtime = 'nodejs';
