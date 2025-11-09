import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, QrCode, Lock, CheckCircle } from "lucide-react"
import { HomeHeader } from "@/components/home-header"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">مشفرة وآمنة QR رموز</h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
                قم بإنشاء رموز مشفرة وغير قابلة للتزوير لحماية معلوماتك الحساسة والتحقق من صحتها بسهولة
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard/create">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                   مشفر QR إنشاء
                </Button>
              </Link>
              <Link href="/verify">
                <Button size="lg" variant="outline" className="text-black border-white hover:bg-slate-800 text-lg px-8">
                  QR التحقق من 
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">مميزات المنصة</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Lock className="h-12 w-12 text-emerald-600 mb-2" />
                  <CardTitle>تشفير قوي</CardTitle>
                  <CardDescription>تشفير البيانات باستخدام خوارزميات RSA أو AES لضمان أمان المعلومات</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    نستخدم أحدث تقنيات التشفير لحماية بياناتك. يتم تشفير جميع المعلومات المخزنة في رموز QR باستخدام
                    مفاتيح خاصة وعامة لضمان عدم إمكانية الوصول إليها من قبل أطراف غير مصرح لها.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-emerald-600 mb-2" />
                  <CardTitle>حماية ضد التزوير</CardTitle>
                  <CardDescription>تقنيات متقدمة لمنع تزوير أو نسخ رموز QR الخاصة بك</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    كل رمز QR يحتوي على توقيع رقمي فريد وختم زمني يجعل من المستحيل تزويره. يمكنك أيضًا تحديد عدد مرات
                    استخدام الرمز أو تاريخ انتهاء صلاحيته.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle className="h-12 w-12 text-emerald-600 mb-2" />
                  <CardTitle>تحقق سهل وسريع</CardTitle>
                  <CardDescription>تحقق من صحة رموز QR باستخدام تطبيق الهاتف أو عبر الموقع</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    يمكن التحقق من صحة رموز QR المشفرة باستخدام تطبيقنا للهاتف المحمول أو عبر موقعنا الإلكتروني. يتم
                    تسجيل كل عملية تحقق في قاعدة البيانات مع معلومات مثل الوقت والموقع.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-slate-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">كيف تعمل المنصة</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">إنشاء البيانات</h3>
                <p>أدخل البيانات التي تريد تشفيرها وحمايتها في نموذج الإنشاء</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">توليد رمز QR</h3>
                <p>يتم تشفير البيانات وتوليد رمز QR فريد يحتوي على المعلومات المشفرة</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">التحقق من الصحة</h3>
                <p>استخدم تطبيق الهاتف أو موقعنا للتحقق من صحة رمز QR وعرض البيانات المشفرة</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">ابدأ اليوم في حماية معلوماتك</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto">
              انضم إلى آلاف المستخدمين الذين يثقون بمنصتنا لحماية معلوماتهم الحساسة
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                إنشاء حساب مجاني
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <QrCode className="h-6 w-6" />
                <h2 className="text-xl font-bold">SecureQR</h2>
              </div>
              <p className="text-slate-300">منصة متكاملة لإنشاء وإدارة رموز QR المشفرة وغير القابلة للتزوير</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link href="/" className="hover:text-white">
                    الرئيسية
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="hover:text-white">
                    المميزات
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    الأسعار
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    اتصل بنا
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link href="/faq" className="hover:text-white">
                    الأسئلة الشائعة
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white">
                    التوثيق
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    الدعم الفني
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-white">
                    حالة النظام
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
              <ul className="space-y-2 text-slate-300">
                <li>البريد الإلكتروني: info@secureqr.com</li>
                <li>الهاتف: +123 456 7890</li>
                <li>العنوان: شارع الرياض، المملكة العربية السعودية</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-300">
            <p>&copy; {new Date().getFullYear()} SecureQR. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
