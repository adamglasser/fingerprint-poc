"use client";

import { useSession } from "next-auth/react";
import LogoutButton from "./LogoutButton";

export default function Header() {
  const { data: session } = useSession();

  if (!session) {
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
            Logged in as <span className="font-medium">{session.user.name}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
} 