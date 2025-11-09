"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/lib/auth-hooks";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();

  // Function to handle subscription
  const handleSubscribe = (plan: string) => {
    setIsLoading(true);
    
    if (!user) {
      // Redirect to login page if not logged in, passing the plan info
      const returnUrl = `/pricing?plan=${plan}&cycle=${billingCycle}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    // If user is logged in, proceed to payment
    router.push(`/payment?plan=${plan}&cycle=${billingCycle}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-center">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">خطط التسعير</h1>
        </header>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">خطط متنوعة لكافة احتياجاتك</h1>
          <p className="text-slate-600 mb-6">اختر الخطة المناسبة لحجم عملك واستخدامك</p>
          
          <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-100 p-1 rounded-full flex">
              <Button
                variant={billingCycle === "monthly" ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => setBillingCycle("monthly")}
              >
                شهري
              </Button>
              <Button
                variant={billingCycle === "yearly" ? "default" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => setBillingCycle("yearly")}
              >
                سنوي <Badge className="mr-1 bg-emerald-500">خصم 20%</Badge>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>الخطة المجانية</CardTitle>
              <CardDescription>للاستخدام الشخصي والتجربة</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">0 ر.س</span>
                <span className="text-slate-500">/شهرياً</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>إنشاء حتى 20 رمز QR</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تشفير أساسي للبيانات</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>صلاحية 30 يوم للرموز</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تقارير أساسية</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSubscribe("free")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارِ التحميل...
                  </>
                ) : (
                  "ابدأ مجاناً"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary relative">
            <div className="absolute -top-3 right-1/2 transform translate-x-1/2 bg-primary text-white text-sm py-1 px-3 rounded-full">
              الأكثر شعبية
            </div>
            <CardHeader>
              <CardTitle>الخطة الاحترافية</CardTitle>
              <CardDescription>للشركات الصغيرة والمتوسطة</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  {billingCycle === "monthly" ? "99" : "79"}
                </span>
                <span className="text-slate-500">
                  {" "}
                  ر.س/{billingCycle === "monthly" ? "شهرياً" : "شهرياً (بالاشتراك السنوي)"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>إنشاء رموز QR غير محدودة</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تشفير متقدم ومضاد للتزوير</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>دعم البلوكشين للتحقق</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تقارير متقدمة وإحصائيات</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تخصيص العلامة التجارية</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>صلاحية غير محدودة</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>API للتكامل مع أنظمتك</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => handleSubscribe("premium")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارِ التحميل...
                  </>
                ) : (
                  "اشترك الآن"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>خطة المؤسسات</CardTitle>
              <CardDescription>للشركات الكبيرة والمؤسسات</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">اتصل بنا</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>جميع مزايا الخطة الاحترافية</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>حلول مخصصة حسب احتياجاتك</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تكامل مع أنظمة المؤسسة</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>دعم فني متخصص على مدار الساعة</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>تدريب فريقك</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-emerald-500 ml-2 mt-0.5" />
                  <span>اتفاقية مستوى خدمة (SLA) مضمونة</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleSubscribe("enterprise")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارِ التحميل...
                  </>
                ) : (
                  "تواصل معنا"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold mb-2">هل لديك استفسارات؟</h2>
          <p className="text-slate-600 mb-4">
            فريقنا جاهز للإجابة على جميع استفساراتك حول خططنا ومزايانا
          </p>
          <Button variant="secondary" asChild>
            <Link href="/contact">تواصل معنا</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 