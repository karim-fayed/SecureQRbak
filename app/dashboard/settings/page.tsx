"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QrCode, ArrowLeft, Download, Copy, Share2, Check, Clock, Bell, Shield, User, Key, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api-client"

export default function SettingsPage() {  
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    language: 'ar',
    timezone: 'asia-riyadh',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    trackQRCodeUsers: true
  })
  const [apiPermissions, setApiPermissions] = useState({
    createQRCode: true,
    viewStats: true,
    verifyQRCode: true
  })
  const [notificationSettings, setNotificationSettings] = useState({
    scanNotifications: true,
    failedVerificationAlerts: true,
    expirationAlerts: true,
    newsletter: false
  })
  
  // Use useEffect for data fetching
  useEffect(() => {
    fetchUserData();
  }, []);  const fetchUserData = async () => {
    setIsPageLoading(true);
    try {
      const data = await authAPI.getCurrentUser();
      setUserData(data.user);
      
      // تحديث بيانات النموذج بالمعلومات الحالية
      setFormData(prev => ({
        ...prev,
        name: data.user.name || '',
        language: data.user.language || 'ar',
        timezone: data.user.timezone || 'asia-riyadh'
      }));
      
      // تحديث إعدادات الأمان إذا كانت موجودة
      if (data.user.securitySettings) {
        setSecuritySettings({
          twoFactorEnabled: data.user.securitySettings.twoFactorEnabled ?? false,
          loginNotifications: data.user.securitySettings.loginNotifications ?? true,
          trackQRCodeUsers: data.user.securitySettings.trackQRCodeUsers ?? true
        });
      }
      
      // تحديث أذونات API إذا كانت موجودة
      if (data.user.apiPermissions) {
        setApiPermissions({
          createQRCode: data.user.apiPermissions.createQRCode ?? true,
          viewStats: data.user.apiPermissions.viewStats ?? true,
          verifyQRCode: data.user.apiPermissions.verifyQRCode ?? true
        });
      }
      
      // تحديث إعدادات الإشعارات إذا كانت موجودة
      if (data.user.notificationSettings) {
        setNotificationSettings({
          scanNotifications: data.user.notificationSettings.scanNotifications ?? true,
          failedVerificationAlerts: data.user.notificationSettings.failedVerificationAlerts ?? true,
          expirationAlerts: data.user.notificationSettings.expirationAlerts ?? true,
          newsletter: data.user.notificationSettings.newsletter ?? false
        });
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات المستخدم:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات المستخدم"
      });
    } finally {
      setIsPageLoading(false);
    }
  };
    // تحديث حقول النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
    // إعادة إنشاء مفاتيح API
  const regenerateApiKeys = async () => {
    if (!confirm("سيؤدي ذلك إلى إبطال جميع المفاتيح الحالية. هل تريد المتابعة؟")) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await authAPI.regenerateApiKeys();
      
      if (result.success) {
        // تحديث بيانات المستخدم بعد إعادة إنشاء المفاتيح
        fetchUserData();
        toast({
          title: "تم التحديث",
          description: "تم تحديث مفاتيح API بنجاح"
        });
      } else {
        throw new Error(result.error || "خطأ غير معروف");
      }    } catch (error: any) {
      console.error("Error regenerating API keys:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إعادة إنشاء مفاتيح API"
      });
    } finally {
      setLoading(false);
    }
  };
  // نسخ مفتاح API
  const copyApiKey = (key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key);
      toast({
        title: "تم النسخ",
        description: "تم نسخ مفتاح API بنجاح"
      });
    } else {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "لم يتمكن المتصفح من نسخ المفتاح"
      });
    }
  };  // حفظ الإعدادات
  const saveSettings = async (data: any) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
        if (result.success) {
        toast({
          title: "تم الحفظ",
          description: "تم حفظ الإعدادات بنجاح"
        });
        // تحديث بيانات المستخدم بعد التحديث
        if (data.name) {
          fetchUserData();
        }
      } else {
        throw new Error(result.error || "خطأ غير معروف");
      }    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات"
      });
    } finally {
      setLoading(false);
    }
  };
    // حفظ إعدادات الحساب
  const saveAccountSettings = () => {
    saveSettings({ 
      name: formData.name,
      language: formData.language,
      timezone: formData.timezone
    });
  };
  
  // حفظ إعدادات الأمان
  const saveSecuritySettings = () => {
    saveSettings({
      securitySettings: securitySettings
    });
  };
  
  // حفظ إعدادات API
  const saveApiSettings = () => {
    saveSettings({
      apiPermissions: apiPermissions
    });
  };
  
  // حفظ إعدادات الإشعارات
  const saveNotificationSettings = () => {
    saveSettings({
      notificationSettings: notificationSettings
    });
  };
  
  // تغيير كلمة المرور
  const changePassword = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "كلمة المرور الجديدة وتأكيدها غير متطابقين"
      });
      return;
    }
    
    saveSettings({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
    
    // مسح حقول كلمات المرور بعد المحاولة
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar would be included through layout */}

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
              <h1 className="text-2xl font-bold">إعدادات الحساب</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4">
          {isPageLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg font-medium">جاري تحميل الإعدادات...</p>
            </div>
          ) : (
          <Tabs defaultValue="account">
            <TabsList className="mb-6">
              <TabsTrigger value="account">الحساب الشخصي</TabsTrigger>
              <TabsTrigger value="security">الأمان والخصوصية</TabsTrigger>
              {(userData?.subscription?.plan === 'premium' || userData?.subscription?.plan === 'enterprise') && (
                <TabsTrigger value="api">واجهة برمجة التطبيقات (API)</TabsTrigger>
              )}
              <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            </TabsList>
            
            {/* حساب المستخدم */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الحساب</CardTitle>
                  <CardDescription>تعديل المعلومات الشخصية وإعدادات الحساب</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="الاسم الكامل" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input 
                      id="email" 
                      defaultValue={userData?.email || ""} 
                      disabled 
                      placeholder="example@domain.com" 
                    />
                    <p className="text-xs text-slate-500">لا يمكن تغيير البريد الإلكتروني</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">اللغة المفضلة</Label>                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر اللغة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">المنطقة الزمنية</Label>                    <Select 
                      value={formData.timezone}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنطقة الزمنية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-riyadh">الرياض (GMT+3)</SelectItem>
                        <SelectItem value="asia-dubai">دبي (GMT+4)</SelectItem>
                        <SelectItem value="asia-cairo">القاهرة (GMT+2)</SelectItem>
                        <SelectItem value="europe-london">لندن (GMT+0/+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    <div className="pt-2">                    <Button 
                      onClick={saveAccountSettings}
                      disabled={loading}
                    >
                      {loading ? "جاري الحفظ..." : "حفظ المعلومات"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* الأمان */}
            <TabsContent value="security">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>كلمة المرور</CardTitle>
                  <CardDescription>تغيير كلمة المرور الخاصة بك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">                    <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      value={formData.currentPassword}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">                    <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="pt-2">                    <Button 
                      onClick={changePassword}
                      disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    >
                      {loading ? "جاري الحفظ..." : "تغيير كلمة المرور"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>خيارات الأمان</CardTitle>
                  <CardDescription>إعدادات أمان الحساب والخصوصية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">المصادقة الثنائية</Label>
                      <p className="text-sm text-slate-500">تفعيل المصادقة الثنائية لتعزيز أمان حسابك</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">إشعارات تسجيل الدخول</Label>
                      <p className="text-sm text-slate-500">إرسال إشعار عند تسجيل الدخول من جهاز جديد</p>
                    </div>
                    <Switch 
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) => {
                        setSecuritySettings(prev => ({ ...prev, loginNotifications: checked }));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">تتبع المستخدمين لرموز QR الخاصة بك</Label>
                      <p className="text-sm text-slate-500">جمع معلومات عن المستخدمين الذين يقومون بمسح رموز QR</p>
                    </div>
                    <Switch 
                      checked={securitySettings.trackQRCodeUsers}
                      onCheckedChange={(checked) => {
                        setSecuritySettings(prev => ({ ...prev, trackQRCodeUsers: checked }));
                      }}
                    />
                  </div>
                    <div className="pt-2">                    <Button onClick={saveSecuritySettings} disabled={loading}>
                      {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* واجهة برمجة التطبيقات */}
            {(userData?.subscription?.plan === 'premium' || userData?.subscription?.plan === 'enterprise') ? (
              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>مفاتيح API</CardTitle>
                    <CardDescription>إدارة مفاتيح API للوصول برمجياً إلى خدمات SecureQR</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>مفتاح API العام</Label>
                    <div className="flex items-center">
                      <Input 
                        value={userData?.apiKeys?.public || "api_public_xxxxxxxxxxxxxxxx"} 
                        readOnly 
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="ml-2" 
                        onClick={() => copyApiKey(userData?.apiKeys?.public || "api_public_xxxxxxxxxxxxxxxx")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>مفتاح API الخاص</Label>
                    <div className="flex items-center">
                      <Input 
                        type={apiKeyVisible ? "text" : "password"} 
                        value={userData?.apiKeys?.private || "api_private_xxxxxxxxxxxxxxxx"} 
                        readOnly 
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="ml-2" 
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">لا تشارك هذا المفتاح مع أي شخص!</p>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-2">صلاحيات API</h3>                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>إنشاء رموز QR</Label>
                        <Switch 
                          checked={apiPermissions.createQRCode}
                          onCheckedChange={(checked) => {
                            setApiPermissions(prev => ({ ...prev, createQRCode: checked }));
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>عرض الإحصائيات</Label>
                        <Switch 
                          checked={apiPermissions.viewStats}
                          onCheckedChange={(checked) => {
                            setApiPermissions(prev => ({ ...prev, viewStats: checked }));
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>التحقق من رموز QR</Label>
                        <Switch 
                          checked={apiPermissions.verifyQRCode}
                          onCheckedChange={(checked) => {
                            setApiPermissions(prev => ({ ...prev, verifyQRCode: checked }));
                          }}
                        />
                      </div>
                    </div>
                  </div>                    <div className="pt-4">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button 
                        onClick={saveApiSettings} 
                        disabled={loading}
                      >
                        {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={regenerateApiKeys}
                        disabled={loading}
                      >
                        {loading ? "جاري المعالجة..." : "إعادة إنشاء مفاتيح API"}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">تحذير: سيؤدي إعادة إنشاء المفاتيح إلى إبطال جميع المفاتيح الحالية.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            ) : (
              <TabsContent value="api">
                <Card>
                  <CardHeader>
                    <CardTitle>واجهة برمجة التطبيقات (API)</CardTitle>
                    <CardDescription>مفاتيح API متاحة فقط للخطة الاحترافية وخطة المؤسسات</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                      <Key className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="text-lg font-semibold mb-2">ترقية مطلوبة</h3>
                      <p className="text-slate-600 mb-4">
                        للحصول على وصول إلى مفاتيح API، يرجى الترقية إلى الخطة الاحترافية أو خطة المؤسسات.
                      </p>
                      <Link href="/pricing">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          عرض الخطط والأسعار
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {/* الإشعارات */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الإشعارات</CardTitle>
                  <CardDescription>تخصيص كيفية استلام الإشعارات من النظام</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إشعارات البريد الإلكتروني</h3>
                      <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>إشعارات عمليات المسح</Label>
                        <p className="text-sm text-slate-500">إرسال إشعار عند مسح أحد رموز QR الخاصة بك</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.scanNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, scanNotifications: checked }));
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>محاولات التحقق الفاشلة</Label>
                        <p className="text-sm text-slate-500">إرسال إشعار عند فشل محاولة تحقق من رمز QR</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.failedVerificationAlerts}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, failedVerificationAlerts: checked }));
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>تنبيهات انتهاء الصلاحية</Label>
                        <p className="text-sm text-slate-500">إرسال إشعار قبل انتهاء صلاحية رمز QR</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.expirationAlerts}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, expirationAlerts: checked }));
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>النشرة الإخبارية</Label>
                        <p className="text-sm text-slate-500">استلام أحدث الأخبار والتحديثات حول SecureQR</p>
                      </div>
                      <Switch 
                        checked={notificationSettings.newsletter}
                        onCheckedChange={(checked) => {
                          setNotificationSettings(prev => ({ ...prev, newsletter: checked }));
                        }}
                      />
                    </div>
                  </div>
                    <div className="pt-4">                    <Button onClick={saveNotificationSettings} disabled={loading}>
                      {loading ? "جاري الحفظ..." : "حفظ إعدادات الإشعارات"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          )}
        </main>
      </div>
    </div>
  )
}
