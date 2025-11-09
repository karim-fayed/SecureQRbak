"use client";

import { useState, useRef } from "react";
import QrScanner from "@/components/ui/qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Keyboard, QrCode, Shield, ShieldAlert, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface VerificationData {
  type: string;
  issuedTo: string;
  issuedBy: string;
  issueDate?: string;
  verificationId: string;
  isAuthentic: boolean;
  status: string;
  timestamp: string;
  note?: string;
  [key: string]: any;
}

export default function QRVerificationClient() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationState, setVerificationState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQRVerification = async (qrData: string) => {
    try {
      console.log('Verifying QR code:', qrData);
      setScanResult(qrData);
      setScanError(null);
      setVerificationState("scanning");

      let encryptedData: string;
      let signature: string;
      let uuid: string | undefined;

      // Try to parse the QR data as JSON first (expected format)
      try {
        const parsedData = JSON.parse(qrData);

        // Check if it's the expected JSON structure
        if (parsedData && typeof parsedData === 'object' && parsedData.data && parsedData.sig) {
          encryptedData = parsedData.data;
          signature = parsedData.sig;
          uuid = parsedData.id;
        } else {
          throw new Error('Invalid JSON structure');
        }
      } catch (parseError) {
        console.warn('QR data is not valid JSON, treating as raw encrypted data:', parseError);

        // Fallback: treat the entire QR data as encrypted data
        // This handles cases where QR codes contain just the encrypted string
        encryptedData = qrData;

        // For raw encrypted data, we need to try verification without signature
        // The API will handle signature verification internally
        signature = '';

        // Try to extract UUID from the data if possible (for better error messages)
        try {
          // Some QR codes might have UUID embedded, but we'll handle this in the API
          uuid = undefined;
        } catch {
          uuid = undefined;
        }
      }

      if (!encryptedData) {
        setScanError('رمز QR غير صالح - البيانات المشفرة مفقودة. تأكد من أن الرمز يحتوي على بيانات صحيحة');
        setVerificationState("error");
        return;
      }

      // Call the verification API with the extracted data
      const requestBody: any = { encryptedData };
      if (signature) {
        requestBody.signature = signature;
      }
      if (uuid) {
        requestBody.verificationCode = uuid; // Use UUID as verification code if available
      }

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        // Set verification data in professional format
        setVerificationData({
          type: result.data.type || "مستند",
          issuedTo: result.data.issuedTo || "غير محدد",
          issuedBy: result.data.issuedBy || (result.data.isAuthentic ? "نظام SecureQR" : "مصدر خارجي"),
          issueDate: result.data.createdAt ? new Date(result.data.createdAt).toLocaleDateString("ar-SA") : new Date().toLocaleDateString("ar-SA"),
          verificationId: result.data.verificationCode || uuid || "غير محدد",
          isAuthentic: result.data.isAuthentic,
          status: result.data.status,
          timestamp: new Date().toISOString(),
          note: result.data.note,
          ...result.data
        });
        setVerificationState("success");
      } else {
        setScanError(result.error || 'فشل في التحقق من الرمز');
        setVerificationState("error");
      }

    } catch (error) {
      console.error('Verification error:', error);
      setScanError('فشل في التحقق من الرمز. تأكد من صحة الرمز الممسوح');
      setVerificationState("error");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setScanError('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setScanError('حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت');
      return;
    }

    setScanError(null);
    setScanResult(null);
    setVerificationData(null);
    setVerificationState("scanning");

    try {
      // Create a temporary div element for file scanning
      const tempDiv = document.createElement('div');
      tempDiv.id = 'file-scanner-temp';
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      // Create a new instance for file scanning with enhanced configuration
      const html5QrCode = new Html5Qrcode("file-scanner-temp");

      // Try multiple scanning approaches for better detection
      let result;
      let scanError;

      try {
        // First try with scanFileV2
        result = await html5QrCode.scanFileV2(file);
      } catch (firstError) {
        console.warn('First scan attempt failed, trying alternative method:', firstError);

        try {
          // Fallback to scanFile with different settings
          result = await html5QrCode.scanFile(file, false);
        } catch (secondError) {
          console.warn('Second scan attempt failed:', secondError);
          scanError = secondError;
        }
      }

      if (!result) {
        throw scanError || new Error('No QR code detected');
      }

      // Handle different result types
      const qrText = typeof result === 'string' ? result : result.decodedText || '';
      handleQRVerification(qrText);

      // Clean up
      html5QrCode.clear();
      document.body.removeChild(tempDiv);
    } catch (error: any) {
      console.error('Image scan error:', error);

      let errorMessage = 'فشل في قراءة الصورة. تأكد من أن الصورة تحتوي على رمز QR واضح وغير مشوه. جرب استخدام الكاميرا بدلاً من رفع الصورة';

      if (error && typeof error === 'object') {
        const err = error as any;
        if (err.name === 'NotFoundException' ||
            err.message?.includes('No MultiFormat Readers') ||
            err.message?.includes('No QR code found') ||
            err.message?.includes('NotFoundException') ||
            err.message?.includes('No QR code detected')) {
          errorMessage = 'لم يتم العثور على رمز QR في الصورة. تأكد من أن الصورة تحتوي على رمز QR واضح وغير مشوه. جرب التقاط صورة جديدة أو استخدم الكاميرا مباشرة';
        } else if (err.message?.includes('timeout')) {
          errorMessage = 'انتهت مهلة قراءة الصورة. حاول مرة أخرى أو استخدم صورة أصغر';
        } else if (err.message?.includes('file size')) {
          errorMessage = 'حجم الصورة كبير جداً. جرب صورة أصغر (أقل من 10 ميجابايت)';
        }
      }

      setScanError(errorMessage);
      setVerificationState("error");
    } finally {
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleQRVerification(manualCode.trim());
    } else {
      setScanError('يرجى إدخال الرمز');
    }
  };

  const tabs = [
    { id: 'camera', label: 'الكاميرا', icon: Camera },
    { id: 'upload', label: 'رفع صورة', icon: Upload },
    { id: 'manual', label: 'إدخال يدوي', icon: Keyboard },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Camera Tab */}
      {activeTab === 'camera' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="h-5 w-5 ml-2 text-blue-600" />
              مسح بالكاميرا
            </CardTitle>
            <CardDescription>استخدم الكاميرا لمسح رمز QR</CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner
              onResult={(result, decodedResult) => {
                console.log('QR Code scanned:', result);
                handleQRVerification(result);
              }}
              onError={(error) => {
                console.error('QR Scanner error:', error);
                setScanError(error);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 ml-2 text-green-600" />
              رفع صورة
            </CardTitle>
            <CardDescription>ارفع صورة تحتوي على رمز QR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 ml-2" />
                اختر صورة
              </Button>
              <p className="text-sm text-slate-500 text-center"></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Tab */}
      {activeTab === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Keyboard className="h-5 w-5 ml-2 text-purple-600" />
              إدخال يدوي
            </CardTitle>
            <CardDescription>أدخل الرمز المختصر الفريد يدوياً</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="manual-code">الرمز المختصر الفريد</Label>
                <Input
                  id="manual-code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="أدخل الرمز هنا..."
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                <QrCode className="h-4 w-4 ml-2" />
                تحقق من الرمز
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Verification Results */}
      {verificationState === "scanning" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-blue-800 font-medium">جاري التحقق من الرمز...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationState === "success" && verificationData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 ml-2" />
              تم التحقق بنجاح
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className={`h-4 w-4 ${verificationData.isAuthentic ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-sm font-medium">حالة الأصالة:</span>
                  <span className={`text-sm ${verificationData.isAuthentic ? 'text-green-700' : 'text-red-700'}`}>
                    {verificationData.isAuthentic ? 'أصلي' : 'غير أصلي'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">نوع المستند:</span> {verificationData.type}
                </div>
                <div className="text-sm">
                  <span className="font-medium">صادر إلى:</span> {verificationData.issuedTo}
                </div>
                <div className="text-sm">
                  <span className="font-medium">صادر بواسطة:</span> {verificationData.issuedBy}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">تاريخ الإصدار:</span> {verificationData.issueDate}
                </div>
                <div className="text-sm">
                  <span className="font-medium">رمز التحقق:</span> {verificationData.verificationId}
                </div>
                <div className="text-sm">
                  <span className="font-medium">الحالة:</span> {verificationData.status}
                </div>
                {verificationData.note && (
                  <div className="text-sm">
                    <span className="font-medium">ملاحظة:</span> {verificationData.note}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-green-200">
              <p className="text-xs text-green-700 text-center">
                تم التحقق في {new Date(verificationData.timestamp).toLocaleString('ar-SA')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationState === "error" && scanError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <XCircle className="h-5 w-5 ml-2" />
              فشل في التحقق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{scanError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
