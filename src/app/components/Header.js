"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip fetching session on login page
    if (pathname === "/login") {
      setLoading(false);
      return;
    }

    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else if (pathname !== "/login") {
          // If no user and not on login page, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        // On error, redirect to login if not already there
        if (pathname !== "/login") {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSession();

    // Set up an interval to periodically check the session
    const intervalId = setInterval(fetchSession, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [pathname, router]);

  // Don't render anything on the login page
  if (pathname === "/login") {
    return null;
  }

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Show nothing if no user (will redirect to login)
  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/FP-Favicon-Orange-WhiteBG-32x32.svg" 
            alt="Fingerprint Logo" 
            className="h-8 w-8" 
          />
          <h1 className="text-xl font-bold text-gray-600">FP Demo App</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Logged in as <span className="font-medium">{user.name}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
} 