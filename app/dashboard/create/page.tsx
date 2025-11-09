"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, ArrowLeft, Download, Copy, Share2, AlertTriangle, Check } from "lucide-react"
import { qrCodeAPI, authAPI } from "../../../lib/api-client"
import FreeUsageStatus from "@/components/ui/free-usage-status"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function CreateQR() {
  const [qrGenerated, setQrGenerated] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [qrInfo, setQrInfo] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  // Estados para los botones de copiar y compartir
  const [isCopied, setIsCopied] = useState(false)
  const [isClientSide, setIsClientSide] = useState(false)
  const { toast } = useToast()

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null)
  const dataRef = useRef<HTMLTextAreaElement>(null)
  const expiryRef = useRef<HTMLInputElement>(null)
  const usageLimitRef = useRef<HTMLInputElement>(null)

  // Detectar entorno de cliente para evitar errores de hidratación
  useEffect(() => {
    setIsClientSide(true)
    
    // جلب بيانات المستخدم الحالي
    const fetchCurrentUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        if (userData && userData.user) {
          setCurrentUser(userData.user);
        }
      } catch (error) {
        console.error("خطأ في جلب بيانات المستخدم:", error);
      }
    };
    
    fetchCurrentUser();
  }, [])

  // Función segura para copiar al portapapeles
  const copyToClipboard = useCallback(async (text: string) => {
    if (!navigator.clipboard) {
      toast({
        variant: "destructive",
        title: "غير مدعوم",
        description: "نسخ إلى الحافظة غير مدعوم في هذا المتصفح."
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast({
        title: "تم النسخ!",
        description: "تم نسخ الرابط إلى الحافظة."
      });
      
      // Restablecer el estado después de 2 segundos
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      return true;
    } catch (err) {
      console.error("فشل النسخ إلى الحافظة:", err);
      toast({
        variant: "destructive",
        title: "فشل النسخ",
        description: "تعذر نسخ النص إلى الحافظة."
      });
      return false;
    }
  }, [toast]);

  // Función para compartir contenido utilizando Web Share API cuando esté disponible
  const handleShare = useCallback(async () => {
    if (!qrInfo || !qrInfo.verificationUrl) {
      toast({
        variant: "destructive",
        title: "لا يمكن المشاركة",
        description: "لا توجد معلومات للمشاركة."
      });
      return;
    }

    const shareData = {
      title: qrInfo.name || "SecureQR Code",
      text: "تحقق من رمز QR الآمن هذا",
      url: qrInfo.verificationUrl,
    };

    try {
      if (navigator.share && isClientSide) {
        await navigator.share(shareData);
        toast({
          title: "تمت المشاركة!",
          description: "تم مشاركة الرابط بنجاح."
        });
      } else {
        // Fallback si Web Share API no está disponible
        await copyToClipboard(qrInfo.verificationUrl);
        toast({
          title: "تم النسخ للمشاركة",
          description: "تم نسخ الرابط. Web Share API غير متوفرة."
        });
      }
    } catch (err) {
      console.error("فشلت المشاركة:", err);
      toast({
        variant: "destructive",
        title: "فشلت المشاركة",
        description: "تعذر مشاركة الرابط."
      });
    }
  }, [qrInfo, isClientSide, copyToClipboard, toast]);

  // Función para descargar el código QR
  const handleDownload = useCallback(() => {
    if (!qrInfo?.qrCode) {
      toast({
        variant: "destructive",
        title: "لا يمكن التنزيل",
        description: "لا توجد صورة QR للتنزيل."
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = qrInfo.qrCode;
      link.download = `${qrInfo.name || qrInfo.verificationCode || 'qr-code'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم التنزيل!",
        description: "تم تنزيل صورة رمز QR بنجاح."
      });
    } catch (err) {
      console.error("فشل تنزيل رمز QR:", err);
      toast({
        variant: "destructive",
        title: "فشل التنزيل",
        description: "تعذر تنزيل صورة رمز QR."
      });
    }
  }, [qrInfo, toast]);

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLimitReached(false)
    setLoading(true)
    setQrGenerated(false)
    setQrInfo(null)
    try {
      const name = nameRef.current?.value || "QR Code"
      const data = dataRef.current?.value || ""
      const expiresAt = expiryRef.current?.value || undefined
      const useLimit = usageLimitRef.current?.value ? Number(usageLimitRef.current.value) : undefined
      if (!data) {
        setError("يرجى إدخال البيانات لتوليد رمز QR")
        setLoading(false)
        return
      }
      const res = await qrCodeAPI.generate({
        name,
        data,
        expiresAt,
        useLimit,
        userId: currentUser?._id,
      })
      setQrGenerated(true)
      // إذا كانت الاستجابة تحتوي على qrCode فقط (DataURL) أو كائن كامل
      if (typeof res.qrCode === 'string') {
        setQrInfo({
          qrCode: res.qrCode,
          verificationCode: res.verificationCode,
          createdAt: new Date().toISOString(),
          encryption: 'AES-256',
          status: 'نشط',
        })
      } else {
        setQrInfo(res.qrCode || null)
      }
    } catch (err: any) {
      if (err.message && err.message.includes("الحد الأقصى")) {
        setLimitReached(true)
        if (err.usageCount) setUsageCount(err.usageCount)
      } else {
        setError(err.message || "حدث خطأ أثناء توليد رمز QR")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white p-4 shadow">
          <div className="container mx-auto">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" /> العودة للوحة التحكم
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">إنشاء رمز QR مشفر</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle>إنشاء رمز QR جديد</CardTitle>
                <CardDescription>أدخل البيانات التي تريد تشفيرها في رمز QR</CardDescription>
              </CardHeader>
              <CardContent>
                <FreeUsageStatus />
                <form onSubmit={handleGenerateQR}>
                  {limitReached && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-5 w-5" />
                      <AlertTitle>لقد وصلت للحد المجاني!</AlertTitle>
                      <AlertDescription>
                        لقد استخدمت الحد الأقصى (20) لإنشاء رموز QR مجانًا.<br />
                        <span className="font-bold">للمتابعة، يرجى <a href="/register" className="underline text-emerald-700">إنشاء حساب</a> أو <a href="/pricing" className="underline text-emerald-700">الاشتراك في باقة</a>.</span>
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-5 w-5" />
                      <AlertTitle>خطأ</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">اسم رمز QR</Label>
                      <Input id="name" placeholder="مثال: شهادة تخرج" ref={nameRef} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-type">نوع البيانات</Label>
                      <Select defaultValue="text">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع البيانات" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">نص</SelectItem>
                          <SelectItem value="url">رابط URL</SelectItem>
                          <SelectItem value="contact">معلومات اتصال</SelectItem>
                          <SelectItem value="custom">مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data">البيانات</Label>
                      <Textarea id="data" placeholder="أدخل البيانات التي تريد تشفيرها" rows={4} ref={dataRef} />
                    </div>

                    <Tabs defaultValue="security" className="mt-6">
                      <TabsList className="mb-4">
                        <TabsTrigger value="security">الأمان</TabsTrigger>
                        <TabsTrigger value="appearance">المظهر</TabsTrigger>
                        <TabsTrigger value="advanced">إعدادات متقدمة</TabsTrigger>
                      </TabsList>

                      <TabsContent value="security">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="encryption">خوارزمية التشفير</Label>
                            <Select defaultValue="aes">
                              <SelectTrigger>
                                <SelectValue placeholder="اختر خوارزمية التشفير" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aes">AES-256</SelectItem>
                                <SelectItem value="rsa">RSA</SelectItem>
                                <SelectItem value="sha">SHA-256 + RSA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="digital-signature">توقيع رقمي</Label>
                            <Switch id="digital-signature" defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="timestamp">ختم زمني</Label>
                            <Switch id="timestamp" defaultChecked />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="appearance">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="color">لون رمز QR</Label>
                            <Select defaultValue="black">
                              <SelectTrigger>
                                <SelectValue placeholder="اختر لون رمز QR" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="black">أسود</SelectItem>
                                <SelectItem value="blue">أزرق</SelectItem>
                                <SelectItem value="green">أخضر</SelectItem>
                                <SelectItem value="red">أحمر</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="logo">إضافة شعار</Label>
                            <Input id="logo" type="file" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="style">نمط رمز QR</Label>
                            <Select defaultValue="standard">
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نمط رمز QR" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">قياسي</SelectItem>
                                <SelectItem value="rounded">حواف دائرية</SelectItem>
                                <SelectItem value="dots">نقاط</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="advanced">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">تاريخ انتهاء الصلاحية</Label>
                            <Input id="expiry" type="date" ref={expiryRef} />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="usage-limit">الحد الأقصى للاستخدام</Label>
                            <Input id="usage-limit" type="number" placeholder="غير محدود" ref={usageLimitRef} />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="geo-restriction">تقييد جغرافي</Label>
                            <Switch id="geo-restriction" />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="device-restriction">تقييد الأجهزة</Label>
                            <Switch id="device-restriction" />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Button type="submit" className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700" disabled={loading || limitReached}>
                    {loading ? "جاري التوليد..." : "توليد رمز QR المشفر"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* QR Preview */}
            <Card>
              <CardHeader>
                <CardTitle>معاينة رمز QR</CardTitle>
                <CardDescription>
                  {qrGenerated ? "تم إنشاء رمز QR المشفر بنجاح" : "سيظهر هنا رمز QR بعد توليده"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {qrGenerated && qrInfo ? (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                      <img src={qrInfo.qrCode} alt="رمز QR المشفر" className="w-48 h-48" />
                    </div>
                    <div className="w-full space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h3 className="font-medium mb-2">معلومات رمز QR</h3>
                        <ul className="space-y-1 text-sm">
                          <li>
                            <span className="font-medium">نوع التشفير:</span> {qrInfo.encryption || 'AES-256'}
                          </li>
                          <li>
                            <span className="font-medium">تاريخ الإنشاء:</span> {qrInfo.createdAt ? new Date(qrInfo.createdAt).toLocaleDateString("ar-SA") : new Date().toLocaleDateString("ar-SA")}
                          </li>
                          <li>
                            <span className="font-medium">المعرف الفريد:</span> {qrInfo.verificationCode || qrInfo._id || '-'}
                          </li>
                          <li>
                            <span className="font-medium">الحالة:</span> <span className="text-green-600">{qrInfo.status || 'نشط'}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <QrCode className="h-16 w-16 mb-4" />
                    <p>قم بملء النموذج وتوليد رمز QR لمعاينته هنا</p>
                  </div>
                )}
              </CardContent>
              {qrGenerated && (
                <CardFooter className="flex flex-col space-y-3">
                  <Button className="w-full" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> تنزيل رمز QR
                  </Button>
                  <div className="flex w-full space-x-2">
                    <Button variant="outline" className="flex-1" onClick={() => copyToClipboard(qrInfo.verificationUrl || '')}>
                      <Copy className="h-4 w-4 mr-2" /> نسخ الرابط
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" /> مشاركة
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
