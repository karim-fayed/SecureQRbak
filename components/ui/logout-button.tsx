"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { authAPI } from "@/lib/api-client";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      // بعد تسجيل الخروج بنجاح، قم بتوجيه المستخدم إلى صفحة تسجيل الدخول
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      // Even if logout API fails, clear local state and redirect
      localStorage.clear();
      sessionStorage.clear();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={`text-white border-slate-700 hover:bg-slate-800 ${className}`}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut className="h-4 w-4 ml-2" />
      {isLoggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
    </Button>
  );
}
