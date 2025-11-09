"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Settings, Shield, Globe, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    siteName: 'SecureQR',
    siteDescription: 'منصة متكاملة لإنشاء وإدارة رموز QR المشفرة',
    maintenanceMode: false,
    allowRegistration: true,
    maxFreeQRCodes: 20,
    emailNotifications: true,
    smsNotifications: false,
  })

  useEffect(() => {
    checkAdminAccess()
    fetchSettings()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const userData = await fetch('/api/user/me').then(r => r.json())
      if (userData?.user?.role === 'admin') {
        setIsAdmin(true)
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      window.location.href = '/dashboard'
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      // في المستقبل يمكن جلب الإعدادات من API
      // const response = await fetch('/api/admin/settings')
      // const data = await response.json()
      // setSettings(data.settings)
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'فشل حفظ الإعدادات')
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات النظام بنجاح"
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات"
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6" />
              <h1 className="text-xl font-bold">إعدادات النظام</h1>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* إعدادات الموقع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 ml-2" />
                إعدادات الموقع
              </CardTitle>
              <CardDescription>تكوين إعدادات الموقع العامة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">اسم الموقع</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">وصف الموقع</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* إعدادات النظام */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 ml-2" />
                إعدادات النظام
              </CardTitle>
              <CardDescription>تكوين إعدادات النظام والأمان</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">وضع الصيانة</Label>
                  <p className="text-sm text-slate-500">إيقاف الموقع مؤقتاً للصيانة</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">السماح بالتسجيل</Label>
                  <p className="text-sm text-slate-500">السماح للمستخدمين الجدد بالتسجيل</p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowRegistration: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxFreeQRCodes">الحد الأقصى لرموز QR المجانية</Label>
                <Input
                  id="maxFreeQRCodes"
                  type="number"
                  value={settings.maxFreeQRCodes}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxFreeQRCodes: parseInt(e.target.value) || 20 }))}
                />
                <p className="text-xs text-slate-500">عدد رموز QR التي يمكن للمستخدمين المجانيين إنشاؤها</p>
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الإشعارات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 ml-2" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription>تكوين طرق الإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">الإشعارات عبر البريد الإلكتروني</Label>
                  <p className="text-sm text-slate-500">إرسال إشعارات عبر البريد الإلكتروني</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">الإشعارات عبر الرسائل النصية</Label>
                  <p className="text-sm text-slate-500">إرسال إشعارات عبر الرسائل النصية (SMS)</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg">
              <Save className="h-4 w-4 ml-2" />
              {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}


