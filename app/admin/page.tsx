import Link from "next/link"
import { redirect } from "next/navigation"
import { isAuthenticatedAsync, getCurrentUserAsync } from "@/lib/auth"
import { connectToDatabase, User, QRCode as QRCodeModel, QRCodeScan } from "@/lib/db"
import { hasAdminPrivileges, ensureOwnerPrivileges, isOwnerEmail } from "@/lib/admin-helpers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Users, Shield, Settings, BarChart3, TrendingUp, AlertCircle, ArrowLeft, Crown, Activity, DollarSign, Clock, Zap, Database, Eye, Trash2, Edit, Search, Filter, Download } from "lucide-react"

export default async function AdminDashboard() {
  // تحقق من المصادقة
  const isAuth = await isAuthenticatedAsync();
  if (!isAuth) redirect("/login");

  // جلب بيانات المستخدم
  const userToken = await getCurrentUserAsync();
  if (!userToken || !userToken.id) redirect("/login");

  // جلب بيانات المستخدم من قاعدة البيانات
  await connectToDatabase();
  
  // التأكد من صلاحيات المالك دائماً
  await ensureOwnerPrivileges(userToken.id);
  
  const userData = await User.findById(userToken.id).select('-password');

  // التحقق من صلاحيات Admin (يشمل المالك)
  const hasAdmin = await hasAdminPrivileges(userToken.id);
  if (!userData || !hasAdmin) {
    redirect("/dashboard");
  }
  
  const isOwner = isOwnerEmail(userData.email);

  // جلب إحصائيات النظام
  const totalUsers = await User.countDocuments();
  const totalQRCodes = await QRCodeModel.countDocuments();
  const premiumUsers = await User.countDocuments({ 'subscription.plan': { $in: ['premium', 'enterprise'] } });
  const freeUsers = await User.countDocuments({ 'subscription.plan': 'free' });
  const adminUsers = await User.countDocuments({ role: 'admin' });
  
  // إحصائيات رموز QR
  const activeQRCodes = await QRCodeModel.countDocuments({ isActive: true });
  const expiredQRCodes = await QRCodeModel.countDocuments({ expiresAt: { $lt: new Date() } });
  
  // إحصائيات المسح
  const totalScans = await QRCodeModel.aggregate([
    { $group: { _id: null, total: { $sum: '$useCount' } } }
  ]);
  const totalScansCount = totalScans[0]?.total || 0;
  
  // إحصائيات السجلات
  const totalScanRecords = await QRCodeScan.countDocuments();
  const validScans = await QRCodeScan.countDocuments({ status: 'valid' });
  const invalidScans = await QRCodeScan.countDocuments({ status: 'invalid' });
  const expiredScans = await QRCodeScan.countDocuments({ status: 'expired' });
  
  // المستخدمون الأخيرون
  const recentUsers = await User.find()
    .select('name email subscription role createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  // رموز QR الأخيرة
  const recentQRCodes = await QRCodeModel.find()
    .select('name userId createdAt useCount expiresAt')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  // أكثر المستخدمين نشاطاً
  const mostActiveUsers = await QRCodeModel.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 }, totalScans: { $sum: '$useCount' } } },
    { $sort: { totalScans: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
  ]);

  // إحصائيات النمو
  const usersThisMonth = await User.countDocuments({
    createdAt: { $gte: new Date(new Date().setDate(1)) }
  });
  const qrCodesThisMonth = await QRCodeModel.countDocuments({
    createdAt: { $gte: new Date(new Date().setDate(1)) }
  });

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
                    <p className="text-sm text-slate-300">لوحة تحكم المالك الرئيسي</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8" />
                  <div>
                    <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
                    <p className="text-sm text-slate-300">إدارة النظام الكاملة</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/dashboard">
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
        {/* إحصائيات رئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">إجمالي المستخدمين</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">
                +{usersThisMonth} هذا الشهر
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">إجمالي رموز QR</CardTitle>
                <QrCode className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{totalQRCodes}</div>
              <p className="text-xs text-slate-500 mt-1">
                +{qrCodesThisMonth} هذا الشهر | {activeQRCodes} نشط
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">المشتركون</CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{premiumUsers}</div>
              <p className="text-xs text-slate-500 mt-1">
                {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}% من المستخدمين
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">عمليات المسح</CardTitle>
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{totalScansCount.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">
                {totalScanRecords} سجل مسح
              </p>
            </CardContent>
          </Card>
        </div>

        {/* صف إحصائيات ثانوية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Zap className="h-4 w-4 ml-2 text-green-500" />
                حالة النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">رموز QR نشطة</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">{activeQRCodes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">رموز QR منتهية</span>
                  <Badge variant="destructive">{expiredQRCodes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">المديرون</span>
                  <Badge variant="secondary">{adminUsers}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <BarChart3 className="h-4 w-4 ml-2 text-blue-500" />
                إحصائيات المسح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">ناجح</span>
                  <Badge className="bg-green-100 text-green-800">{validScans}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">فاشل</span>
                  <Badge variant="destructive">{invalidScans}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">منتهي</span>
                  <Badge className="bg-orange-100 text-orange-800">{expiredScans}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                <Database className="h-4 w-4 ml-2 text-purple-500" />
                توزيع الخطط
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>مجاني</span>
                    <span>{freeUsers}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-slate-400 h-2 rounded-full" 
                      style={{ width: `${totalUsers > 0 ? (freeUsers / totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>مشترك</span>
                    <span>{premiumUsers}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      style={{ width: `${totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أزرار الإدارة السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/users">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 bg-gradient-to-br from-white to-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-600" />
                  <ArrowLeft className="h-4 w-4 text-slate-400" />
                </div>
                <CardTitle className="mt-2">إدارة المستخدمين</CardTitle>
                <CardDescription>عرض وتعديل جميع المستخدمين</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/system-settings">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-500 bg-gradient-to-br from-white to-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Settings className="h-8 w-8 text-purple-600" />
                  <ArrowLeft className="h-4 w-4 text-slate-400" />
                </div>
                <CardTitle className="mt-2">إعدادات النظام</CardTitle>
                <CardDescription>تكوين الإعدادات العامة</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/logs">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-green-500 bg-gradient-to-br from-white to-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <ArrowLeft className="h-4 w-4 text-slate-400" />
                </div>
                <CardTitle className="mt-2">سجلات النظام</CardTitle>
                <CardDescription>عرض جميع سجلات المسح</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/qr-verification">
            <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-emerald-500 bg-gradient-to-br from-white to-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <QrCode className="h-8 w-8 text-emerald-600" />
                  <ArrowLeft className="h-4 w-4 text-slate-400" />
                </div>
                <CardTitle className="mt-2">التحقق من QR</CardTitle>
                <CardDescription>أداة التحقق من رموز QR</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-orange-500 bg-gradient-to-br from-white to-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-orange-600" />
                <Download className="h-4 w-4 text-slate-400" />
              </div>
              <CardTitle className="mt-2">تصدير البيانات</CardTitle>
              <CardDescription>تصدير بيانات النظام (قريباً)</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* جداول البيانات */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* المستخدمون الأخيرون */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 ml-2 text-blue-600" />
                    المستخدمون الأخيرون
                  </CardTitle>
                  <CardDescription>آخر 5 مستخدمين مسجلين</CardDescription>
                </div>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm">
                    عرض الكل
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.map((user: any) => (
                  <div key={user._id.toString()} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </Badge>
                      <Link href={`/admin/users/${user._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* رموز QR الأخيرة */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <QrCode className="h-5 w-5 ml-2 text-purple-600" />
                    رموز QR الأخيرة
                  </CardTitle>
                  <CardDescription>آخر 5 رموز QR تم إنشاؤها</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentQRCodes.map((qr: any) => (
                  <div key={qr._id.toString()} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{qr.name || 'رمز QR'}</p>
                        <p className="text-xs text-slate-500">
                          {qr.userId ? (typeof qr.userId === 'object' ? qr.userId.name || qr.userId.email : 'غير معروف') : 'مجهول'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{qr.useCount || 0} استخدام</Badge>
                      {qr.expiresAt && new Date(qr.expiresAt) < new Date() && (
                        <Badge variant="destructive">منتهي</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أكثر المستخدمين نشاطاً */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 ml-2 text-emerald-600" />
              أكثر المستخدمين نشاطاً
            </CardTitle>
            <CardDescription>المستخدمون الأكثر إنشاءاً لرموز QR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium">المستخدم</th>
                    <th className="text-right py-3 px-4 font-medium">عدد رموز QR</th>
                    <th className="text-right py-3 px-4 font-medium">إجمالي المسح</th>
                  </tr>
                </thead>
                <tbody>
                  {mostActiveUsers.map((item: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {item.user ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                              {item.user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium">{item.user.name || 'مجهول'}</p>
                              <p className="text-xs text-slate-500">{item.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          'مجهول'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{item.count}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-100 text-emerald-800">{item.totalScans}</Badge>
                      </td>
                    </tr>
                  ))}
                  {mostActiveUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500">
                        لا توجد بيانات متاحة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
