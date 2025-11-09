"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode } from "lucide-react"
import { authAPI } from "@/lib/api-client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // التحقق من حالة المصادقة عند تحميل الصفحة
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // محاولة الحصول على بيانات المستخدم الحالي
        const userData = await authAPI.getCurrentUser();
        if (userData && userData.user) {
          // المستخدم مسجل الدخول بالفعل، توجيهه إلى لوحة التحكم
          router.push('/dashboard');
        }
      } catch (error) {
        // حدث خطأ أو المستخدم غير مسجل الدخول، لا نفعل شيئًا
        console.log("User not authenticated");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await authAPI.login({ email, password })
      // تحقق من وجود مسار إعادة توجيه في الكوكي
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      
      // Login successful - use router to navigate after a short delay to ensure cookies are set
      setTimeout(() => {
        // الحصول على مسار إعادة التوجيه إن وجد، وإلا الانتقال إلى لوحة التحكم
        const redirectPath = '/dashboard';
        router.push(redirectPath)
        router.refresh() // Refresh the router cache
      }, 500) // Short delay to ensure cookies are properly set
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center space-x-2">
            <QrCode className="h-6 w-6" />
            <Link href="/">
              <h1 className="text-xl font-bold">SecureQR</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {isCheckingAuth ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-medium">جاري التحقق من الجلسة...</p>
          </div>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
              <CardDescription>قم بتسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-800">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-slate-500">أو</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                تسجيل الدخول باستخدام Google
              </Button>
              <div className="text-center text-sm">
                ليس لديك حساب؟{" "}
                <Link href="/register" className="text-emerald-600 hover:text-emerald-800 font-medium">
                  إنشاء حساب جديد
                </Link>
              </div>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}
