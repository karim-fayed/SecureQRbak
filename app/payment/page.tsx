"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurrentUser } from "../../lib/auth-hooks";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"stc_bank" | "credit_card">("stc_bank");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [stcMobileNumber, setStcMobileNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get plan details from URL parameters
  const plan = searchParams.get("plan") || "free"; 
  const cycle = searchParams.get("cycle") || "monthly";

  // Check if user is authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      // Redirect to login if not logged in
      const returnUrl = `/payment?plan=${plan}&cycle=${cycle}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, userLoading, router, plan, cycle]);

  // Define plan prices
  const planPrices = {
    free: { monthly: 0, yearly: 0 },
    premium: { monthly: 99, yearly: 948 }, // 948 = 79 × 12 (with 20% discount)
    enterprise: { monthly: null, yearly: null } // Contact us pricing
  };

  // Calculate price based on plan and billing cycle
  const getPrice = () => {
    // @ts-ignore - We know these keys exist
    return planPrices[plan]?.[cycle] || 0;
  };

  const price = getPrice();
  
  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (paymentMethod === "stc_bank" && !stcMobileNumber) {
      setError("يرجى إدخال رقم الجوال المسجل في STC Pay");
      return;
    }
    
    if (paymentMethod === "credit_card" && (!cardNumber || !expiryDate || !cvv || !nameOnCard)) {
      setError("يرجى إكمال جميع بيانات بطاقة الائتمان");
      return;
    }
    
    if (!agreeTerms) {
      setError("يرجى الموافقة على الشروط والأحكام");
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Set payment status to processing
    setPaymentStatus("processing");
    
    try {
      // Simulate API call to payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, you would send a request to your backend,
      // which would then communicate with the payment gateway
      
      // For demo purposes, we'll simulate a successful payment
      setPaymentStatus("success");
      
      // After successful payment, update the user's subscription in your backend
      try {
        // This would be a real API call to update the subscription
        console.log(`Activating ${plan} subscription with ${cycle} billing cycle`);
        
        // Call API to activate subscription
        // await subscriptionAPI.activate({
        //   userId: user?.id,
        //   plan: plan,
        //   billingCycle: cycle,
        //   paymentMethod: paymentMethod,
        //   amount: price
        // });
        
        // For now just log the activation
        console.log("Subscription activated successfully!");
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push("/dashboard?subscription=activated");
        }, 3000);
      } catch (subscriptionError) {
        console.error("Error activating subscription:", subscriptionError);
        setError("تم الدفع بنجاح ولكن حدثت مشكلة في تفعيل الاشتراك. سيقوم فريق الدعم بالتواصل معك قريباً.");
      }
      
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      setError("حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.");
    }
  };

  // Translate plan names to Arabic
  const getPlanName = () => {
    switch (plan) {
      case "premium":
        return "الاحترافية";
      case "enterprise":
        return "المؤسسات";
      default:
        return "المجانية";
    }
  };

  // If still loading user data, show loading state
  if (userLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">جارِ التحميل...</h2>
                <p className="text-slate-600">يرجى الانتظار قليلاً</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:py-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 flex items-center">
          <Link href="/pricing" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">إتمام الدفع</h1>
        </header>

        {paymentStatus === "success" ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-green-700 mb-2">تم الدفع بنجاح!</h2>
                <p className="text-green-600 mb-6">
                  شكراً لك على الاشتراك في خطة {getPlanName()}. تم تفعيل حسابك بنجاح.
                </p>
                <Button asChild>
                  <Link href="/dashboard">الانتقال إلى لوحة التحكم</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : paymentStatus === "error" ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>فشلت عملية الدفع</AlertTitle>
            <AlertDescription>
              {error || "حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى."}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mb-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>تفاصيل الخطة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-500">الخطة المختارة</Label>
                        <p className="font-medium">الخطة {getPlanName()}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500">نوع الاشتراك</Label>
                        <p className="font-medium">{cycle === "monthly" ? "شهري" : "سنوي"}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between">
                        <span className="font-medium">الإجمالي</span>
                        <span className="font-bold text-xl">
                          {price === null ? "اتصل بنا" : `${price} ر.س`}
                          {cycle === "yearly" && <span className="text-xs text-emerald-600 mr-2">(خصم 20%)</span>}
                        </span>
                      </div>
                      {cycle === "monthly" && (
                        <p className="text-sm text-slate-500 mt-1">تجدد تلقائياً في نهاية كل شهر</p>
                      )}
                      {cycle === "yearly" && (
                        <p className="text-sm text-slate-500 mt-1">تجدد تلقائياً في نهاية كل سنة</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(price === null || price === 0) ? (
                <Card>
                  <CardContent className="pt-6">
                    {price === null ? (
                      <div className="text-center py-6">
                        <h2 className="text-xl font-bold mb-2">خطة المؤسسات</h2>
                        <p className="mb-4">
                          للحصول على خطة مخصصة تناسب احتياجات مؤسستك، يرجى التواصل مع فريق المبيعات.
                        </p>
                        <Button asChild>
                          <Link href="/contact">تواصل مع فريق المبيعات</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <h2 className="text-xl font-bold mb-2">الخطة المجانية</h2>
                        <p className="mb-4">
                          يمكنك البدء باستخدام الخطة المجانية مباشرة من لوحة التحكم.
                        </p>
                        <Button asChild>
                          <Link href="/dashboard">الانتقال إلى لوحة التحكم</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>طريقة الدفع</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === "stc_bank" ? "border-primary bg-primary/5" : "border-slate-200"}`}
                            onClick={() => setPaymentMethod("stc_bank")}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">بنك STC</div>
                              <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                                {paymentMethod === "stc_bank" && <div className="w-3 h-3 rounded-full bg-primary" />}
                              </div>
                            </div>
                            <p className="text-sm text-slate-500">دفع مباشر عبر بنك STC</p>
                          </div>
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === "credit_card" ? "border-primary bg-primary/5" : "border-slate-200"}`}
                            onClick={() => setPaymentMethod("credit_card")}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">بطاقة ائتمان</div>
                              <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                                {paymentMethod === "credit_card" && <div className="w-3 h-3 rounded-full bg-primary" />}
                              </div>
                            </div>
                            <p className="text-sm text-slate-500">فيزا، ماستركارد، مدى</p>
                          </div>
                        </div>

                        {paymentMethod === "stc_bank" && (
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="stc_mobile">رقم الجوال المسجل في STC Pay</Label>
                              <Input
                                id="stc_mobile"
                                placeholder="05xxxxxxxx"
                                value={stcMobileNumber}
                                onChange={(e) => setStcMobileNumber(e.target.value)}
                                className="mt-1 dir-ltr text-left"
                              />
                            </div>
                            <div>
                              <Label htmlFor="account_number">رقم الحساب (اختياري)</Label>
                              <Input
                                id="account_number"
                                placeholder="SA0000000000000000000000"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="mt-1 dir-ltr text-left"
                              />
                            </div>
                            <Alert className="bg-blue-50 border-blue-200">
                              <AlertDescription>
                                سيتم تحويلك إلى تطبيق STC Pay لإكمال عملية الدفع.
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}

                        {paymentMethod === "credit_card" && (
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label htmlFor="card_name">الاسم على البطاقة</Label>
                              <Input
                                id="card_name"
                                placeholder="الاسم كما هو على البطاقة"
                                value={nameOnCard}
                                onChange={(e) => setNameOnCard(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="card_number">رقم البطاقة</Label>
                              <Input
                                id="card_number"
                                placeholder="XXXX XXXX XXXX XXXX"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="mt-1 dir-ltr text-left"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                                <Input
                                  id="expiry"
                                  placeholder="MM/YY"
                                  value={expiryDate}
                                  onChange={(e) => setExpiryDate(e.target.value)}
                                  className="mt-1 dir-ltr text-left"
                                />
                              </div>
                              <div>
                                <Label htmlFor="cvv">رمز الأمان</Label>
                                <Input
                                  id="cvv"
                                  placeholder="CVV"
                                  value={cvv}
                                  onChange={(e) => setCvv(e.target.value)}
                                  className="mt-1 dir-ltr text-left"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mb-6 flex items-start space-x-2 gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal">
                      أوافق على <Link href="/terms" className="text-primary underline">الشروط والأحكام</Link> وسياسة الخصوصية
                    </Label>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link href="/pricing">العودة</Link>
                    </Button>
                    <Button type="submit" disabled={paymentStatus === "processing"}>
                      {paymentStatus === "processing" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          جاري معالجة الدفع...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 ml-2" />
                          إتمام الدفع
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">جارِ التحميل...</h2>
                <p className="text-slate-600">يرجى الانتظار قليلاً</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
} 