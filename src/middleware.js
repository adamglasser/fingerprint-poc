import { NextResponse } from "next/server";

// Define paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/webhooks",
  "/api/webhooks",
  "/api/fingerprint-webhook",
  "/account-takeover-demo",
  "/api/account-takeover-demo"
];

// Protected paths that require authentication
const protectedPaths = [
  "/dashboard"
];

// Helper function to check if a path is public
function isPublicPath(pathname) {
  // Special case for root path
  if (pathname === "/") {
    return true;
  }
  
  return publicPaths.some(path => {
    if (path === pathname) {
      return true;
    }
    // Special handling for account-takeover-demo to match all subpaths
    if (path === "/account-takeover-demo" && pathname.startsWith("/account-takeover-demo/")) {
      return true;
    }
    return pathname.startsWith(path);
  });
}

// Helper function to check if a path is protected
function isProtectedPath(pathname) {
  return protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

export async function middleware(request) {
  try {
    // Check the path
    const { pathname } = request.nextUrl;
    
    // Allow access to public paths without authentication
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    
    // Check if the path requires authentication
    if (isProtectedPath(pathname)) {
      // Check for auth token in cookies
      const authToken = request.cookies.get('auth-token')?.value;
      
      // Redirect to login if not authenticated
      if (!authToken) {
        // Store the original URL to redirect back after login
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
    
    // Allow access for authenticated users or paths we don't explicitly control
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, redirect to login for protected paths
    const { pathname } = request.nextUrl;
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
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