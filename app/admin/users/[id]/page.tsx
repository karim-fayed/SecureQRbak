"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Shield, Mail, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { authAPI } from "@/lib/api-client"

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const userId = params.id as string

  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    subscriptionPlan: 'free' as 'free' | 'premium' | 'enterprise',
    subscriptionStatus: 'active' as 'active' | 'inactive' | 'cancelled',
  })

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'فشل جلب بيانات المستخدم' }))
        throw new Error(errorData.error || 'فشل جلب بيانات المستخدم')
      }
      
      const data = await response.json()
      
      if (!data.success || !data.user) {
        throw new Error(data.error || 'فشل جلب بيانات المستخدم')
      }
      
      setUserData(data.user)
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || 'user',
        subscriptionPlan: data.user.subscription?.plan || 'free',
        subscriptionStatus: data.user.subscription?.status || 'active',
      })
    } catch (error: any) {
      console.error("Error fetching user data:", error)
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء جلب بيانات المستخدم"
      })
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          subscription: {
            plan: formData.subscriptionPlan,
            status: formData.subscriptionStatus,
          }
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'فشل تحديث المستخدم')
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المستخدم بنجاح"
      })
      
      router.push('/admin/users')
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث المستخدم"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-6 w-6" />
              <h1 className="text-xl font-bold">تعديل المستخدم</h1>
            </div>
            <Link href="/admin/users">
              <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المستخدم</CardTitle>
              <CardDescription>تعديل بيانات المستخدم وإعدادات الاشتراك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">لا يمكن تغيير البريد الإلكتروني</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">الدور</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'user' | 'admin') => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="admin">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">خطة الاشتراك</Label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value: 'free' | 'premium' | 'enterprise') => 
                    setFormData(prev => ({ ...prev, subscriptionPlan: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">مجانية</SelectItem>
                    <SelectItem value="premium">احترافية</SelectItem>
                    <SelectItem value="enterprise">مؤسسات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionStatus">حالة الاشتراك</Label>
                <Select
                  value={formData.subscriptionStatus}
                  onValueChange={(value: 'active' | 'inactive' | 'cancelled') => 
                    setFormData(prev => ({ ...prev, subscriptionStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="cancelled">ملغى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 ml-2" />
                  {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Link href="/admin/users">
                  <Button variant="outline">إلغاء</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

