"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Don't render header on login page
  if (pathname === "/login") {
    return null;
  }

  useEffect(() => {
    // Function to fetch session data
    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/session");
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
    }

    fetchSession();

    // Set up an interval to periodically check the session
    const intervalId = setInterval(fetchSession, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

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
        {user && !loading && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Logged in as <span className="font-medium">{user.name}</span>
            </div>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
} 