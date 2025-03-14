"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        router.push("/login");
        router.refresh();
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isLoggingOut 
          ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      <LogOut size={16} />
      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
    </button>
  );
} 