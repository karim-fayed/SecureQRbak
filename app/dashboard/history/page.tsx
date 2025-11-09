import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, History, Settings, Plus, Download, Eye, LogOut, ExternalLink, Shield, Crown, TrendingUp, Activity, BarChart3, Calendar, MapPin, AlertCircle, ArrowLeft } from "lucide-react"
import { LogoutButton } from "@/components/ui/logout-button"

import { redirect } from "next/navigation"
import { isAuthenticatedAsync, getCurrentUserAsync } from "@/lib/auth"
import { connectToDatabase, User, QRCode as QRCodeModel, QRCodeScan } from "@/lib/db"
import { isOwnerEmail } from "@/lib/admin-helpers"

export default async function HistoryPage() {
  // تحقق من الجلسة
  const isAuth = await isAuthenticatedAsync();
  if (!isAuth) redirect("/login");

  // جلب بيانات المستخدم الحقيقية من الـ token
  const userToken = await getCurrentUserAsync();
  if (!userToken || !userToken.id) redirect("/login");

  // جلب بيانات المستخدم من قاعدة البيانات
  await connectToDatabase();
  const userData = await User.findById(userToken.id).select('-password');
  const isOwner = userData ? isOwnerEmail(userData.email) : false;

  // جلب رموز QR الخاصة بالمستخدم
  const qrCodesFromDB = await QRCodeModel.find({ userId: userToken.id })
    .select('-encryptedData')
    .sort({ createdAt: -1 });

  // جلب سجل التحققات من قاعدة البيانات
  const qrCodeIds = qrCodesFromDB.map(qr => qr._id);

  // جلب سجلات التحقق المتعلقة برموز QR الخاصة بالمستخدم
  const scansFromDB = qrCodeIds.length > 0
    ? await QRCodeScan.find({ qrCodeId: { $in: qrCodeIds } })
        .sort({ scanDate: -1 })
    : [];

  // إنشاء قاموس للوصول السريع إلى بيانات رمز QR
  const qrCodeMap: { [key: string]: any } = {};
  qrCodesFromDB.forEach(qr => {
    qrCodeMap[qr._id.toString()] = qr;
  });

  // تحويل بيانات التحققات إلى التنسيق المطلوب
  const verificationLogs = scansFromDB.map(scan => ({
    id: scan._id.toString(),
    qrName: qrCodeMap[scan.qrCodeId?.toString()]?.name || "رمز QR",
    verifiedAt: scan.scanDate ? new Date(scan.scanDate).toLocaleString("ar-SA") : "",
    status: scan.status === 'valid' ? "ناجح" : scan.status === 'expired' ? "منتهي" : "فاشل",
    location: scan.location?.city || scan.location?.country || "غير معروف",
    ipAddress: scan.ipAddress || "غير معروف",
    userAgent: scan.userAgent || "غير معروف"
  }));

  const totalScans = verificationLogs.length;
  const successfulScans = verificationLogs.filter(log => log.status === "ناجح").length;
  const failedScans = verificationLogs.filter(log => log.status === "فاشل").length;
  const expiredScans = verificationLogs.filter(log => log.status === "منتهي").length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
              <QrCode className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SecureQR</h1>
              <p className="text-xs text-slate-400">منصة مشفرة</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700 transition-all group"
          >
            <QrCode className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">رموز QR</span>
          </Link>

          <Link
            href="/dashboard/history"
            className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all group"
          >
            <History className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">سجل التحقق</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700 transition-all group"
          >
            <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">الإعدادات</span>
          </Link>

          {userData?.role === 'admin' && (
            <div className="pt-4 border-t border-slate-700">
              <Link
                href="/admin"
                className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 transition-all group shadow-lg"
              >
                {isOwner ? (
                  <Crown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                )}
                <span className="font-bold">نفذكف</span>
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="p-3 bg-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 mb-1">مسجل الدخول كـ</p>
            <p className="font-medium text-sm truncate">{userToken.email}</p>
            {isOwner && (
              <Badge className="mt-2 bg-yellow-500 text-slate-900 text-xs">
                <Crown className="h-3 w-3 ml-1" />
                مالك النظام
              </Badge>
            )}
          </div>
          <LogoutButton className="w-full" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4 ml-2" />
                    العودة
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">سجل التحقق</h1>
                  <p className="text-sm text-slate-600 mt-1">
                    جميع عمليات التحقق من رموز QR الخاصة بك
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/admin/qr-verification">
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all">
                    <QrCode className="h-4 w-4 ml-2" />
                    التحقق من QR
                  </Button>
                </Link>
                <Link href="/dashboard/create">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء QR جديد
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
          <div className="container mx-auto p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">إجمالي عمليات التحقق</CardTitle>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{totalScans}</div>
                  <p className="text-xs text-slate-500 mt-1">عمليات مسح</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">عمليات ناجحة</CardTitle>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{successfulScans}</div>
                  <p className="text-xs text-slate-500 mt-1">{totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0}% من الإجمالي</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">عمليات فاشلة</CardTitle>
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{failedScans}</div>
                  <p className="text-xs text-slate-500 mt-1">{totalScans > 0 ? Math.round((failedScans / totalScans) * 100) : 0}% من الإجمالي</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">رموز منتهية</CardTitle>
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{expiredScans}</div>
                  <p className="text-xs text-slate-500 mt-1">{totalScans > 0 ? Math.round((expiredScans / totalScans) * 100) : 0}% من الإجمالي</p>
                </CardContent>
              </Card>
            </div>

            {/* History Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 ml-2 text-blue-600" />
                  تفاصيل عمليات التحقق
                </CardTitle>
                <CardDescription>سجل مفصل بعمليات التحقق من رموز QR الخاصة بك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {verificationLogs.length > 0 ? (
                    <div className="space-y-3">
                      {verificationLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              log.status === "ناجح"
                                ? "bg-green-100"
                                : log.status === "منتهي"
                                ? "bg-orange-100"
                                : "bg-red-100"
                            }`}>
                              {log.status === "ناجح" ? (
                                <Activity className="h-6 w-6 text-green-600" />
                              ) : log.status === "منتهي" ? (
                                <Calendar className="h-6 w-6 text-orange-600" />
                              ) : (
                                <AlertCircle className="h-6 w-6 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">{log.qrName}</h3>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 ml-1" />
                                  {log.verifiedAt}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 ml-1" />
                                  {log.location}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                IP: {log.ipAddress} • {log.userAgent.split(' ').slice(0, 3).join(' ')}...
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={log.status === "ناجح" ? "default" : "destructive"}
                            className={
                              log.status === "ناجح"
                                ? "bg-green-100 text-green-800"
                                : log.status === "منتهي"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <QrCode className="h-10 w-10 text-slate-400" />
                      </div>
                      <p className="text-slate-600 mb-2">لا توجد سجلات تحقق حتى الآن</p>
                      <p className="text-sm text-slate-500 mb-4">ابدأ بقراءة رمز QR لإنشاء أول سجل تحقق</p>
                      <Link href="/admin/qr-verification">
                        <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600">
                          <QrCode className="h-4 w-4 ml-2" /> التحقق من QR
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
