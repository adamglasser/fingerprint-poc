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
  "/api/fingerprint-webhook"
];

// Function to check if a path should be accessible without authentication
function isPublicPath(pathname) {
  // Check exact matches first
  if (publicPaths.includes(pathname)) {
    return true;
  }
  
  // Check path prefixes for API routes and static resources
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.") ||
    pathname.endsWith(".svg")
  ) {
    return true;
  }
  
  return false;
}

// Function to check if path is part of the account takeover demo
function isAccountTakeoverPath(pathname) {
  return pathname.startsWith("/account-takeover-demo") || 
         pathname.startsWith("/api/account-takeover-demo");
}

export async function middleware(request) {
  try {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for account takeover demo paths
    // These have their own simulated authentication system
    if (isAccountTakeoverPath(pathname)) {
      return NextResponse.next();
    }
    
    // Allow access to public paths without authentication
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    
    // For all other paths, require authentication
    const authToken = request.cookies.get('auth-token')?.value;
    
    // Redirect to login if not authenticated
    if (!authToken) {
      // Store the original URL to redirect back after login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // User is authenticated, allow access
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