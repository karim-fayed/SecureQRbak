"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Key, Globe, BarChart3, Smartphone, Fingerprint, Blocks, AlertTriangle } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-center">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">مميزات النظام</h1>
        </header>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">حلول أمنية متقدمة لرموز QR</h1>
          <p className="text-slate-600 max-w-3xl mx-auto">
            يوفر نظام SecureQR مجموعة شاملة من الميزات المتقدمة لحماية رموز QR من التزوير والتلاعب،
            مما يجعله الخيار الأمثل للمؤسسات والشركات التي تتطلب أعلى مستويات الأمان.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>تشفير متقدم</CardTitle>
              <CardDescription>
                تشفير قوي بمعايير AES-256 لحماية البيانات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                يتم تشفير جميع البيانات باستخدام خوارزميات تشفير متقدمة، مما يضمن حماية المعلومات الحساسة من الوصول غير المصرح به.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Key className="h-10 w-10 text-primary mb-2" />
              <CardTitle>توقيع رقمي</CardTitle>
              <CardDescription>
                توقيع كل رمز QR لضمان الأصالة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                يتم إنشاء توقيع رقمي فريد لكل رمز QR، مما يسمح بالتحقق من مصدر الرمز وضمان عدم تعديله.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Blocks className="h-10 w-10 text-primary mb-2" />
              <CardTitle>تكامل البلوكشين</CardTitle>
              <CardDescription>
                تسجيل الرموز على شبكة بلوكشين للتحقق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                إمكانية تسجيل رموز QR على سلسلة البلوكشين لتوفير طبقة إضافية من التحقق وحماية البيانات من التلاعب.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <AlertTriangle className="h-10 w-10 text-primary mb-2" />
              <CardTitle>كشف التلاعب</CardTitle>
              <CardDescription>
                آليات متقدمة لكشف التلاعب بالرموز
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                نظام كشف متطور للتلاعب يمكنه تحديد أي محاولة لتعديل محتويات رمز QR أو الوصول غير المصرح به.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Fingerprint className="h-10 w-10 text-primary mb-2" />
              <CardTitle>بصمة الجهاز</CardTitle>
              <CardDescription>
                التعرف على الأجهزة المستخدمة للمسح
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                جمع البصمة الرقمية للأجهزة التي تقوم بمسح الرموز، مما يوفر طبقة إضافية من الأمان ويسمح بتتبع الوصول.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>تحليلات متقدمة</CardTitle>
              <CardDescription>
                إحصائيات وتقارير شاملة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                لوحة تحكم مفصلة توفر إحصائيات حول استخدام رموز QR، بما في ذلك الموقع الجغرافي ونوع الجهاز وأوقات المسح.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Globe className="h-10 w-10 text-primary mb-2" />
              <CardTitle>واجهة API</CardTitle>
              <CardDescription>
                دمج النظام مع تطبيقاتك الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                واجهة برمجة تطبيقات (API) شاملة تسمح بدمج نظام SecureQR مع أنظمتك وتطبيقاتك الحالية بسهولة.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Smartphone className="h-10 w-10 text-primary mb-2" />
              <CardTitle>تجربة استخدام متميزة</CardTitle>
              <CardDescription>
                واجهة سهلة الاستخدام ومتوافقة مع الأجهزة المحمولة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                واجهة مستخدم سلسة وسهلة الاستخدام، متوافقة مع جميع الأجهزة المحمولة وأنظمة التشغيل.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>خيارات التحقق المتعددة</CardTitle>
              <CardDescription>
                طرق متنوعة للتحقق من صحة الرموز
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                دعم لطرق متعددة للتحقق من صحة الرموز، بما في ذلك التحقق عبر الإنترنت والتحقق المحلي والتحقق عبر البلوكشين.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-50 rounded-lg p-8 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">مجالات الاستخدام</h2>
            <p className="text-slate-600">يمكن استخدام SecureQR في مجموعة متنوعة من المجالات والصناعات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-1">الشهادات والوثائق</h3>
              <p className="text-slate-600 text-sm">شهادات رسمية، دبلومات، وثائق تعليمية</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-1">التذاكر والدعوات</h3>
              <p className="text-slate-600 text-sm">تذاكر الفعاليات، دعوات المناسبات الخاصة</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-1">المنتجات الفاخرة</h3>
              <p className="text-slate-600 text-sm">التحقق من أصالة المنتجات الفاخرة ومكافحة التقليد</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-1">أنظمة التحكم بالدخول</h3>
              <p className="text-slate-600 text-sm">الوصول إلى المرافق والمناطق المقيدة</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-1">الخدمات الحكومية</h3>
              <p className="text-slate-600 text-sm">الوثائق الرسمية والمعاملات الحكومية</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-1">المؤسسات المالية</h3>
              <p className="text-slate-600 text-sm">المعاملات المالية وتأكيد الهوية</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">جاهز للبدء؟</h2>
          <p className="text-slate-600 mb-4">
            ابدأ اليوم في استخدام أكثر أنظمة QR أماناً وتطوراً
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button>
              <Link href="/register">إنشاء حساب</Link>
            </Button>
            <Button variant="outline">
              <Link href="/pricing">عرض الأسعار</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 