import Link from "next/link"
import { redirect } from "next/navigation"
import { isAuthenticatedAsync, getCurrentUserAsync } from "@/lib/auth"
import { connectToDatabase, User, QRCodeScan, QRCode as QRCodeModel } from "@/lib/db"
import { hasAdminPrivileges, ensureAdminPrivileges, isOwnerEmail } from "@/lib/admin-helpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Users, Shield, Settings, BarChart3, TrendingUp, AlertCircle, ArrowLeft, Crown, Activity, DollarSign, Clock, Zap, Database, Eye, Trash2, Edit, Search, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock as ClockIcon } from "lucide-react"
import QRVerificationClient from "@/components/ui/qr-verification-client"
import { qrCodeAPI } from "@/lib/api-client"

export default async function AdminQRVerificationPage() {
  // تحقق من المصادقة
  const isAuth = await isAuthenticatedAsync();
  if (!isAuth) redirect("/login");

  // جلب بيانات المستخدم
  const userToken = await getCurrentUserAsync();
  if (!userToken || !userToken.id) redirect("/login");

  // جلب بيانات المستخدم من قاعدة البيانات
  await connectToDatabase();

  // التأكد من صلاحيات الإدارة (يشمل المالك)
  await ensureAdminPrivileges(userToken.id);

  const userData = await User.findById(userToken.id).select('-password');

  // التحقق من صلاحيات Admin (يشمل المالك)
  const hasAdmin = await hasAdminPrivileges(userToken.id);
  if (!userData || !hasAdmin) {
    redirect("/dashboard");
  }

  const isOwner = isOwnerEmail(userData.email);

  // جلب إحصائيات التحقق
  const totalScans = await QRCodeScan.countDocuments();
  const validScans = await QRCodeScan.countDocuments({ status: 'valid' });
  const invalidScans = await QRCodeScan.countDocuments({ status: 'invalid' });
  const expiredScans = await QRCodeScan.countDocuments({ status: 'expired' });

  // جلب أحدث عمليات التحقق
  const recentScans = await QRCodeScan.find()
    .populate('qrCodeId', 'name userId')
    .populate('qrCodeId.userId', 'name email')
    .sort({ scanDate: -1 })
    .limit(20);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOwner ? (
                <div className="flex items-center space-x-2">
                  <Crown className="h-8 w-8 text-yellow-400" />
                  <div>
                    <h1 className="text-2xl font-bold">نفذكف</h1>
                    <p className="text-sm text-slate-300">التحقق من رموز QR</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8" />
                  <div>
                    <h1 className="text-2xl font-bold">التحقق من رموز QR</h1>
                    <p className="text-sm text-slate-300">أداة التحقق الإدارية</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/admin">
                <Button variant="outline" className="bg-transparent text-white border-slate-600 hover:bg-slate-700">
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  لوحة التحكم
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* إحصائيات التحقق */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">إجمالي عمليات المسح</CardTitle>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalScans}</div>
              <p className="text-xs text-slate-500 mt-1">جميع عمليات المسح</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">عمليات ناجحة</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{validScans}</div>
              <p className="text-xs text-slate-500 mt-1">{totalScans > 0 ? Math.round((validScans / totalScans) * 100) : 0}% نجاح</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">عمليات فاشلة</CardTitle>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{invalidScans}</div>
              <p className="text-xs text-slate-500 mt-1">{totalScans > 0 ? Math.round((invalidScans / totalScans) * 100) : 0}% فشل</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">رموز منتهية</CardTitle>
                <ClockIcon className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{expiredScans}</div>
              <p className="text-xs text-slate-500 mt-1">{totalScans > 0 ? Math.round((expiredScans / totalScans) * 100) : 0}% منتهية</p>
            </CardContent>
          </Card>
        </div>

        {/* أداة التحقق من QR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ماسح QR */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 ml-2 text-emerald-600" />
                ماسح رموز QR
              </CardTitle>
              <CardDescription>استخدم الكاميرا لمسح وتحقق من رموز QR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div id="qr-scanner-container" className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <QrCode className="h-12 w-12 mx-auto mb-2" />
                    <p>اضغط على "استخدام الكاميرا" لبدء المسح</p>
                  </div>
                </div>
                <QRVerificationClient />
              </div>
            </CardContent>
          </Card>

          {/* إدخال يدوي */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 ml-2 text-blue-600" />
                التحقق اليدوي
              </CardTitle>
              <CardDescription>أدخل بيانات رمز QR يدوياً للتحقق</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="verification-code">رمز التحقق</Label>
                  <Input
                    id="verification-code"
                    placeholder="أدخل رمز التحقق"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="encrypted-data">البيانات المشفرة</Label>
                  <Input
                    id="encrypted-data"
                    placeholder="أدخل البيانات المشفرة"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="signature">التوقيع</Label>
                  <Input
                    id="signature"
                    placeholder="أدخل التوقيع"
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تحقق من الرمز
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* نتائج التحقق */}
        <Card className="shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 ml-2 text-purple-600" />
              نتائج التحقق الأخيرة
            </CardTitle>
            <CardDescription>آخر 20 عملية تحقق تمت</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium">رمز QR</th>
                    <th className="text-right py-3 px-4 font-medium">المستخدم</th>
                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 font-medium">عنوان IP</th>
                    <th className="text-right py-3 px-4 font-medium">تاريخ المسح</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan: any) => (
                    <tr key={scan._id.toString()} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {scan.qrCodeId ? (typeof scan.qrCodeId === 'object' ? scan.qrCodeId.name || 'رمز QR' : 'رمز QR') : 'غير معروف'}
                      </td>
                      <td className="py-3 px-4">
                        {scan.qrCodeId?.userId ? (
                          typeof scan.qrCodeId.userId === 'object' ?
                            scan.qrCodeId.userId.name || scan.qrCodeId.userId.email :
                            'مستخدم'
                        ) : 'غير معروف'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={scan.status === 'valid' ? 'default' : 'destructive'}
                          className={
                            scan.status === 'valid'
                              ? 'bg-green-100 text-green-800'
                              : scan.status === 'invalid'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }
                        >
                          {scan.status === 'valid' ? 'ناجح' :
                           scan.status === 'invalid' ? 'فاشل' : 'منتهي'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{scan.ipAddress || '-'}</td>
                      <td className="py-3 px-4">
                        {scan.scanDate
                          ? new Date(scan.scanDate).toLocaleString("ar-SA")
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentScans.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  لا توجد عمليات تحقق حتى الآن
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


