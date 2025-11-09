"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  fps?: number;
  qrbox?: number;
  disableFlip?: boolean;
  verbose?: boolean;
  aspectRatio?: number;
  onResult: (result: string, decodedResult: any) => void;
  onError?: (error: any) => void;
}

export default function QrScanner({
  fps = 10,
  qrbox = 250,
  disableFlip = false,
  verbose = false,
  aspectRatio,
  onResult,
  onError,
}: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionInProgress, setPermissionInProgress] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerContainerId = "qr-scanner-container";

  // إضافة متغير لتتبع أخطاء المسح المتكررة
  const lastErrorRef = useRef<{ message: string; timestamp: number } | null>(null);
  const errorThrottleMs = 3000; // 3 ثوان بين كل تبليغ خطأ

  // إمكانية ضبط الحساسية (التكبير)
  const [zoomLevel, setZoomLevel] = useState(1.0); // مستوى التكبير الافتراضي 1.0

  useEffect(() => {
    // تهيئة ماسح QR فقط عند تحميل المكون
    if (!html5QrCode && typeof window !== "undefined") {
      const newHtml5QrCode = new Html5Qrcode(scannerContainerId);
      setHtml5QrCode(newHtml5QrCode);
    }

    // تنظيف عند إزالة المكون
    return () => {
      if (html5QrCode && isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            console.log("QR Scanner stopped");
          })
          .catch((err: Error) => {
            console.error("Failed to stop QR Scanner", err);
          });
      }
    };
  }, [html5QrCode, isScanning]);

  // دالة منفصلة لطلب إذن الكاميرا
  const requestCameraPermission = async () => {
    if (!html5QrCode) return false;

    setPermissionInProgress(true);
    try {
      // التحقق من وضع الأذونات الحالي
      const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName });

      if (permissionStatus.state === "denied") {
        // تم رفض الإذن مسبقًا
        setPermissionDenied(true);
        setPermissionGranted(false);
        return false;
      }

      // طلب الإذن من المستخدم بشكل صريح
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // إغلاق الـ stream فورًا لأننا فقط نريد الحصول على الإذن
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // الحصول على قائمة الكاميرات المتاحة
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setPermissionGranted(true);
        setPermissionDenied(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Camera permission denied:", err);
      setPermissionDenied(true);
      setPermissionGranted(false);
      return false;
    } finally {
      setPermissionInProgress(false);
    }
  };

  const startScanner = async () => {
    if (!html5QrCode) return;

    try {
      // طلب إذن الكاميرا أولاً
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        if (onError) onError("تم رفض إذن الكاميرا");
        return;
      }

      // الحصول على الكاميرات المتاحة
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setPermissionDenied(true);
        if (onError) onError("لم يتم العثور على كاميرات متاحة");
        return;
      }

      const cameraId = devices[0].id;

      // ضبط إعدادات متقدمة للحساسية
      const config = {
        fps,
        qrbox: { width: qrbox, height: qrbox },
        aspectRatio: aspectRatio || 1.0,
        disableFlip,
        verbose,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true, // استخدام واجهة BarcodeDetector الأكثر دقة إذا كانت متوفرة
        },
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText: string, decodedResult: any) => {
          onResult(decodedText, decodedResult);
          // توقف المسح تلقائيًا بمجرد العثور على نتيجة
          stopScanner();
        },
        (errorMessage: string) => {
          // تجاهل أخطاء "No QR code found" تمامًا
          if (
            errorMessage.includes("No QR code found") ||
            errorMessage.includes("No MultiFormat Readers were able to detect the code")
          ) {
            // تجاهل هذه الأخطاء تمامًا - لا نقوم بأي شيء
            return;
          }

          // بالنسبة للأخطاء الأخرى، نتأكد من عدم إرسالها بشكل متكرر
          if (onError) {
            const now = Date.now();
            if (
              !lastErrorRef.current ||
              lastErrorRef.current.message !== errorMessage ||
              now - lastErrorRef.current.timestamp > errorThrottleMs
            ) {
              lastErrorRef.current = { message: errorMessage, timestamp: now };
              onError(errorMessage);
            }
          }
        }
      );

      // تفعيل حالة المسح فوراً لإظهار واجهة المستخدم المناسبة
      setIsScanning(true);
    } catch (err) {
      if (onError) onError(err);
      console.error("Error starting scanner:", err);
    }
  };

  const stopScanner = () => {
    if (html5QrCode && isScanning) {
      html5QrCode
        .stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err: Error) => {
          console.error("Failed to stop QR Scanner", err);
        });
    }
  };

  // تغيير مستوى التكبير (إذا كان مدعومًا)
  const handleZoomChange = async (newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
    // نحتفظ فقط بقيمة الزووم في الحالة ولا نحاول تطبيقه ديناميكيًا
  };

  return (
    <div className="qr-scanner-wrapper">
      <div id={scannerContainerId} ref={scannerRef} style={{ width: "100%" }} />

      <div className="flex flex-col mt-4 space-y-4">
        {!isScanning && !permissionInProgress && (
          <>
            <button
              onClick={startScanner}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={permissionInProgress}
            >
              استخدام الكاميرا
            </button>

            {permissionDenied && (
              <div className="text-red-500 text-sm text-center mt-2">
                تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح.
              </div>
            )}
          </>
        )}

        {permissionInProgress && (
          <div className="text-amber-500 text-center animate-pulse">جارٍ تشغيل الكاميرا...</div>
        )}

        {isScanning && (
          <div className="flex flex-col space-y-4">
            <button
              onClick={stopScanner}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              إيقاف المسح
            </button>

            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">ضبط الحساسية (التكبير)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm">{zoomLevel}x</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 text-center animate-pulse">
              جارِ المسح... قرّب الكاميرا من رمز QR
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
