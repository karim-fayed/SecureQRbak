"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { QrCode } from "lucide-react"
import { authAPI } from "@/lib/api-client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("كلمات المرور غير متطابقة")
      return
    }
    
    // Validate terms agreement
    if (!formData.agreeTerms) {
      setError("يجب الموافقة على الشروط والأحكام")
      return
    }
    
    setLoading(true)
    
    try {
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      // Registration successful - redirect to login
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب')
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>أنشئ حسابك للوصول إلى جميع ميزات منصة SecureQR</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="محمد أحمد"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeTerms: checked as boolean }))}
                  required
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  أوافق على{" "}
                  <Link href="/terms" className="text-emerald-600 hover:text-emerald-800">
                    شروط الاستخدام
                  </Link>{" "}
                  و{" "}
                  <Link href="/privacy" className="text-emerald-600 hover:text-emerald-800">
                    سياسة الخصوصية
                  </Link>
                </label>
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
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">أو</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              التسجيل باستخدام Google
            </Button>
            <div className="text-center text-sm">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-800 font-medium">
                تسجيل الدخول
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
