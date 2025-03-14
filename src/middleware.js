import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  try {
    // Get the token using the secret from environment variables
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    const isAuthenticated = !!token;
    
    // Define public paths that don't require authentication
    const publicPaths = ["/login"];
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    // Check if the path is for the Next Auth API or webhooks
    const isAuthPath = request.nextUrl.pathname.startsWith("/api/auth");
    const isWebhookPath = request.nextUrl.pathname.startsWith("/webhooks") || 
                          request.nextUrl.pathname.startsWith("/api/webhooks") ||
                          request.nextUrl.pathname.startsWith("/api/fingerprint-webhook");
    
    // Allow access to public paths, auth API, and webhooks without authentication
    if (isPublicPath || isAuthPath || isWebhookPath) {
      return NextResponse.next();
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Allow access to protected routes if authenticated
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, allow the request to proceed to avoid blocking the application
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