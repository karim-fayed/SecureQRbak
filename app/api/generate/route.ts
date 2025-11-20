import { type NextRequest, NextResponse } from "next/server"
import { generateQRCode } from "@/lib/qr-generator"
import { qrCodeOperations, anonymousUsageOperations } from "@/lib/database-abstraction"
import { createEncryptedQRData, generateUUID } from "@/lib/encryption"

// المفتاح السري للتشفير (نستخدم الآن من متغيرات البيئة)
const SECRET_KEY = process.env.API_PRIVATE_KEY || "58c5b930-923d-40ce-8f94-1ca693c20034"

// الحد الأقصى للاستخدام المجاني
const FREE_USAGE_LIMIT = 20;

export async function POST(request: NextRequest) {
  try {
    // استخراج البيانات من الطلب
    const body = await request.json()
    const { data, options, name, description, userId, expiresAt, useLimit } = body
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // التحقق من وجود البيانات
    if (!data) {
      return NextResponse.json({ error: "البيانات مطلوبة لتوليد رمز QR" }, { status: 400 })
    }

    // التحقق من المستخدم - إذا لم يكن هناك مستخدم، فهذا استخدام مجاني
    if (!userId) {
      // تحقق من عدد مرات الاستخدام المجاني للمستخدم المجهول
      const anonymousResult = await anonymousUsageOperations.findByIp(ipAddress);

      if (anonymousResult.success && anonymousResult.data) {
        const anonymousUser = anonymousResult.data;

        // إذا تجاوز الحد الأقصى للاستخدام المجاني
        if (anonymousUser.count >= FREE_USAGE_LIMIT) {
          return NextResponse.json({
            error: "لقد تجاوزت الحد الأقصى للاستخدام المجاني. يرجى إنشاء حساب للمتابعة.",
            limitReached: true,
            usageCount: anonymousUser.count
          }, { status: 403 });
        }

        // تحديث عدد مرات الاستخدام
        await anonymousUsageOperations.update(ipAddress, {
          count: anonymousUser.count + 1,
          lastUsed: new Date()
        });
      } else {
        // إنشاء سجل جديد للمستخدم المجهول
        await anonymousUsageOperations.create({
          ipAddress,
          userAgent,
          count: 1,
          lastUsed: new Date()
        });
      }
    }

    // تشفير البيانات
    const encryptedDataObj = createEncryptedQRData(data, SECRET_KEY)

    // توليد رمز QR مشفر
    const qrCodeDataURL = await generateQRCode(data, SECRET_KEY, options || {})

    // إنشاء كود تحقق
    const verificationCode = generateUUID().substring(0, 8);

    // تخزين معلومات رمز QR في قاعدة البيانات باستخدام العمليات المزدوجة
    const qrResult = await qrCodeOperations.create({
      name: name || 'QR Code',
      data: JSON.stringify(data),
      encryptedData: encryptedDataObj.encryptedData,
      signature: encryptedDataObj.signature || '',
      userId: userId || '',
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      useLimit: useLimit,
      useCount: 0,
      anonymousCreation: !userId,
      verificationCode: verificationCode
    });

    // التحقق من نجاح العملية
    if (!qrResult.mongoSuccess) {
      console.error("MongoDB QR code creation failed:", qrResult.mongoError);
      return NextResponse.json({ error: "حدث خطأ أثناء حفظ رمز QR" }, { status: 500 });
    }

    // تسجيل حالة المزامنة
    if (!qrResult.sqlSuccess) {
      console.warn("SQL Server QR code sync failed:", qrResult.sqlError);
      // متابعة مع النجاح في MongoDB
    }

    // إرجاع رمز QR كاستجابة
    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      qrCodeId: qrResult.mongoSuccess ? 'generated' : undefined, // يمكن تحسين هذا لاحقاً
      verificationCode: verificationCode,
      syncStatus: {
        mongoSuccess: qrResult.mongoSuccess,
        sqlSuccess: qrResult.sqlSuccess
      }
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء توليد رمز QR" }, { status: 500 })
  }
}
