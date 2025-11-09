"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Loader2, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!name || !email || !message) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    
    // Clear previous errors
    setError(null);
    setStatus("submitting");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success
      setStatus("success");
      
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setSubject("general");
      setMessage("");
      
    } catch (err) {
      console.error("Form submission error:", err);
      setStatus("error");
      setError("حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.");
    }
  };

  const getSubjectLabel = () => {
    switch (subject) {
      case "sales":
        return "استفسار عن المبيعات";
      case "support":
        return "الدعم الفني";
      case "enterprise":
        return "خطة المؤسسات";
      default:
        return "استفسار عام";
    }
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
          <h1 className="text-2xl font-bold">تواصل معنا</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            {status === "success" ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-green-700 mb-2">تم إرسال رسالتك بنجاح!</h2>
                    <p className="text-green-600 mb-6">
                      شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.
                    </p>
                    <Button asChild>
                      <Link href="/">العودة إلى الصفحة الرئيسية</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>أرسل لنا رسالة</CardTitle>
                  <CardDescription>يمكنك التواصل معنا لأي استفسار أو طلب</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني <span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم الجوال</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">نوع الاستفسار</Label>
                        <Select value={subject} onValueChange={setSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder={getSubjectLabel()} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">استفسار عام</SelectItem>
                            <SelectItem value="sales">استفسار عن المبيعات</SelectItem>
                            <SelectItem value="support">الدعم الفني</SelectItem>
                            <SelectItem value="enterprise">خطة المؤسسات</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <Label htmlFor="message">الرسالة <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={status === "submitting"} className="w-full">
                      {status === "submitting" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-2" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>معلومات التواصل</CardTitle>
                <CardDescription>يمكنك التواصل معنا مباشرة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-primary ml-3 mt-1" />
                    <div>
                      <h3 className="font-medium">البريد الإلكتروني</h3>
                      <p className="text-slate-600">info@secureqr.sa</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-primary ml-3 mt-1" />
                    <div>
                      <h3 className="font-medium">الهاتف</h3>
                      <p className="text-slate-600">+966 12 345 6789</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-primary ml-3 mt-1" />
                    <div>
                      <h3 className="font-medium">العنوان</h3>
                      <p className="text-slate-600">
                        طريق الملك فهد، برج المملكة، الرياض
                        <br />
                        المملكة العربية السعودية
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>ساعات العمل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">الأحد - الخميس</span>
                    <span>9:00 ص - 5:00 م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">الجمعة</span>
                    <span>مغلق</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">السبت</span>
                    <span>9:00 ص - 2:00 م</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 