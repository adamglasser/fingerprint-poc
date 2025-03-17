"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Function to fetch session data
  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store',
        headers: {
          // Add a timestamp to bust cache
          'x-timestamp': Date.now().toString()
        }
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch session data whenever pathname changes
    // This ensures the header updates after navigation
    fetchSession();
    
    // Also set up a periodic refresh (less frequent)
    const intervalId = setInterval(fetchSession, 30000);
    
    return () => clearInterval(intervalId);
  }, [pathname]); // Re-run when pathname changes

  // Don't render header on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <img 
              src="/FP-Favicon-Orange-WhiteBG-32x32.svg" 
              alt="Fingerprint Logo" 
              className="h-8 w-8" 
            />
          </Link>
          <h1 className="text-xl font-bold text-gray-600 dark:text-gray-300">
            <Link href="/">FP Demo App</Link>
          </h1>
        </div>
        
        {/* If user is authenticated, show user info and logout button */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Logged in as <span className="font-medium">{user.name}</span>
            </div>
            <LogoutButton onLogout={() => setUser(null)} />
          </div>
        )}
      </div>
    </header>
  );
} 