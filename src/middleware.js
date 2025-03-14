import { NextResponse } from "next/server";

// Define paths that don't require authentication
const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/webhooks",
  "/api/webhooks",
  "/api/fingerprint-webhook"
];

// Helper function to check if a path is public
function isPublicPath(pathname) {
  return publicPaths.some(path => pathname.startsWith(path));
}

export async function middleware(request) {
  try {
    // Check if the path is public
    const { pathname } = request.nextUrl;
    
    // Allow access to public paths without authentication
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    
    // Check for auth token in cookies
    const authToken = request.cookies.get('auth-token')?.value;
    
    // Redirect to login if not authenticated
    if (!authToken) {
      // Store the original URL to redirect back after login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Allow access to protected routes if authenticated
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
}; 