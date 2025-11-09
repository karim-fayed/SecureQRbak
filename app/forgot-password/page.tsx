"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, ArrowLeft, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إرسال الطلب')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال طلب إعادة تعيين كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <QrCode className="h-6 w-6" />
              <Link href="/">
                <h1 className="text-xl font-bold">SecureQR</h1>
              </Link>
            </div>
            <Link href="/login">
              <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة لتسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription>
              أدخل بريدك الإلكتروني وسنرسل طلب إعادة تعيين كلمة المرور للمالك للمراجعة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-6">
                <div className="rounded-full p-4 inline-block mb-4 bg-green-100 text-green-800">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-medium mb-4 text-green-800">
                  تم إرسال الطلب بنجاح!
                </h3>
                <p className="text-slate-600 mb-6">
                  تم إرسال طلب إعادة تعيين كلمة المرور للمالك. سيتم إشعارك عند الموافقة على الطلب.
                </p>
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  إرسال رابط آخر
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="text-center">
            <div className="text-sm text-slate-600">
              تذكرت كلمة المرور؟{" "}
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
