"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QrCode, LogOut, Shield } from "lucide-react"
import { authAPI } from "@/lib/api-client"
import { useRouter } from "next/navigation"

export function HomeHeader() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const userData = await authAPI.getCurrentUser()
      if (userData && userData.user) {
        setIsAuthenticated(true)
        setUser(userData.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      setIsAuthenticated(false)
      setUser(null)
      // Clear any cached data
      localStorage.clear()
      sessionStorage.clear()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
      // Even if logout API fails, clear local state and redirect
      setIsAuthenticated(false)
      setUser(null)
      localStorage.clear()
      sessionStorage.clear()
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <header className="bg-slate-900 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <QrCode className="h-8 w-8" />
            <h1 className="text-2xl font-bold">SecureQR</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-slate-300">
              الرئيسية
            </Link>
            <Link href="/features" className="hover:text-slate-300">
              المميزات
            </Link>
            <Link href="/pricing" className="hover:text-slate-300">
              الأسعار
            </Link>
            <Link href="/contact" className="hover:text-slate-300">
              اتصل بنا
            </Link>
          </nav>
          <div className="flex space-x-2">
            {isLoading ? (
              <div className="w-32 h-10"></div>
            ) : isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900">
                    لوحة التحكم
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button className="bg-yellow-400 text-slate-900 hover:bg-yellow-500 border-yellow-400">
                      <Shield className="h-4 w-4 ml-2" />
                      نفذكف
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">إنشاء حساب</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

