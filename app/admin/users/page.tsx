import Link from "next/link"
import { redirect } from "next/navigation"
import { isAuthenticatedAsync, getCurrentUserAsync } from "@/lib/auth"
import { connectToDatabase, User } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Edit, Shield, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function AdminUsersPage() {
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

  // جلب جميع المستخدمين
  const users = await User.find()
    .select('name email role subscription createdAt')
    .sort({ createdAt: -1 });

  // حساب الإحصائيات
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const premiumUsers = users.filter(u => 
    u.subscription?.plan === 'premium' || u.subscription?.plan === 'enterprise'
  ).length;
  const freeUsers = users.filter(u => u.subscription?.plan === 'free').length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-bold">إدارة المستخدمين</h1>
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
        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">إجمالي المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">المديرون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">المشتركون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{premiumUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">المجانيون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{freeUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* جدول المستخدمين */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المستخدمين</CardTitle>
            <CardDescription>عرض وإدارة جميع المستخدمين المسجلين في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4 font-medium">الاسم</th>
                    <th className="text-right py-3 px-4 font-medium">البريد الإلكتروني</th>
                    <th className="text-right py-3 px-4 font-medium">الدور</th>
                    <th className="text-right py-3 px-4 font-medium">خطة الاشتراك</th>
                    <th className="text-right py-3 px-4 font-medium">حالة الاشتراك</th>
                    <th className="text-right py-3 px-4 font-medium">تاريخ التسجيل</th>
                    <th className="text-right py-3 px-4 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user._id.toString()} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 ml-2 text-slate-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800 font-medium' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.subscription?.plan === 'premium' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : user.subscription?.plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.subscription?.plan === 'premium' ? 'احترافية' :
                           user.subscription?.plan === 'enterprise' ? 'مؤسسات' : 'مجانية'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.subscription?.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.subscription?.status === 'active' ? 'نشط' :
                           user.subscription?.status === 'cancelled' ? 'ملغى' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-SA") : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/admin/users/${user._id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 ml-2" />
                            تعديل
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


