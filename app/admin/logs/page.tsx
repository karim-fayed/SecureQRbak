import Link from "next/link"
import { redirect } from "next/navigation"
import { isAuthenticatedAsync, getCurrentUserAsync } from "@/lib/auth"
import { connectToDatabase, User, QRCodeScan } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Filter, Download, RefreshCw } from "lucide-react"

export default async function AdminLogsPage() {
  // تحقق من المصادقة والصلاحيات
  const isAuth = await isAuthenticatedAsync();
  if (!isAuth) redirect("/login");

  const userToken = await getCurrentUserAsync();
  if (!userToken || !userToken.id) redirect("/login");

  await connectToDatabase();
  const userData = await User.findById(userToken.id).select('-password');

  if (!userData || userData.role !== 'admin') {
    redirect("/dashboard");
  }

  // جلب سجلات المسح
  const scanLogs = await QRCodeScan.find()
    .populate('qrCodeId', 'name')
    .sort({ scanDate: -1 })
    .limit(100);

  // حساب الإحصائيات
  const totalScans = await QRCodeScan.countDocuments();
  const validScans = await QRCodeScan.countDocuments({ status: 'valid' });
  const invalidScans = await QRCodeScan.countDocuments({ status: 'invalid' });
  const expiredScans = await QRCodeScan.countDocuments({ status: 'expired' });

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-6 w-6" />
              <h1 className="text-xl font-bold">سجلات النظام</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/admin">
                <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        {/* إحصائيات السجلات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">إجمالي عمليات المسح</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalScans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">العمليات الناجحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{validScans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">العمليات الفاشلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{invalidScans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">الرموز المنتهية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiredScans}</div>
            </CardContent>
          </Card>
        </div>

        {/* جدول السجلات */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>سجلات مسح رموز QR</CardTitle>
                <CardDescription>آخر 100 عملية مسح لرموز QR</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium">رمز QR</th>
                    <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 font-medium">عنوان IP</th>
                    <th className="text-right py-3 px-4 font-medium">المتصفح</th>
                    <th className="text-right py-3 px-4 font-medium">تاريخ المسح</th>
                  </tr>
                </thead>
                <tbody>
                  {scanLogs.map((log: any) => (
                    <tr key={log._id.toString()} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {log.qrCodeId 
                          ? (typeof log.qrCodeId === 'object' ? log.qrCodeId.name || 'رمز QR' : 'رمز QR')
                          : 'غير معروف'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'valid' 
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'invalid'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {log.status === 'valid' ? 'ناجح' :
                           log.status === 'invalid' ? 'فاشل' : 'منتهي'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{log.ipAddress || '-'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {log.userAgent || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {log.scanDate 
                          ? new Date(log.scanDate).toLocaleString("ar-SA")
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {scanLogs.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  لا توجد سجلات مسح حتى الآن
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


