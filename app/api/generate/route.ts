import { type NextRequest, NextResponse } from "next/server"
import { generateQRCode } from "@/lib/qr-generator"
import { qrCodeOperations, anonymousUsageOperations, userOperations } from "@/lib/database-abstraction"
import { createEncryptedQRData, generateUUID } from "@/lib/encryption"

const SECRET_KEY = process.env.API_PRIVATE_KEY || "58c5b930-923d-40ce-8f94-1ca693c20034"
const FREE_USAGE_LIMIT = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, options, name, description, userId, expiresAt, useLimit, macAddress } = body
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!data) {
      return NextResponse.json({ error: "البيانات مطلوبة لتوليد رمز QR" }, { status: 400 })
    }

    // التحقق من المستخدم المجاني أو المدفوع
    if (!userId) {
      const anonymousResult = await anonymousUsageOperations.findByIp(ipAddress, macAddress);
      
      if (anonymousResult.success && anonymousResult.data) {
        const { count, lastUsed, macAddressLinked } = anonymousResult.data;

        // تحقق إذا كان قد تم ربط الـ MAC address بالبريد الإلكتروني
        if (!macAddressLinked && macAddress) {
          await anonymousUsageOperations.linkMacToEmail(ipAddress, macAddress);
        }

        // تحقق من عدد مرات الاستخدام المجاني
        if (count >= FREE_USAGE_LIMIT) {
          return NextResponse.json({
            error: "لقد تجاوزت الحد الأقصى للاستخدام المجاني. يرجى إنشاء حساب للمتابعة.",
            limitReached: true,
            usageCount: count
          }, { status: 403 });
        }

        // تحديث عدد مرات الاستخدام
        await anonymousUsageOperations.update(ipAddress, macAddress, {
          count: count + 1,
          lastUsed: new Date()
        });
      } else {
        // إنشاء سجل جديد للمستخدم المجهول
        await anonymousUsageOperations.create({
          ipAddress,
          macAddress,
          userAgent,
          count: 1,
          lastUsed: new Date(),
          macAddressLinked: !!macAddress
        });
      }
    } else {
      // في حالة المستخدم المدفوع (المشترك)
      const user = await userOperations.findById(userId);

      if (!user || !user.subscription || user.subscription.plan !== 'premium') {
        return NextResponse.json({
          error: "يتطلب الوصول إلى هذه الميزة اشتراكًا مميزًا"
        }, { status: 403 });
      }
    }

    // التحقق من صلاحية رمز QR قبل توليده
    const qrValidityCheck = await qrCodeOperations.isQRCodeValid({ userId, expiresAt });
    if (!qrValidityCheck) {
      return NextResponse.json({
        error: "رمز QR غير صالح أو انتهت صلاحية البيانات"
      }, { status: 400 });
    }

    // توليد التشفير ورمز QR بالتوازي لزيادة السرعة
    const [encryptedDataObj, qrCodeDataURL] = await Promise.all([
      createEncryptedQRData(data, SECRET_KEY),
      generateQRCode(data, SECRET_KEY, options || {})
    ]);

    const verificationCode = generateUUID().substring(0, 8);

    // تخزين البيانات في قاعدة البيانات
    const qrResult = await qrCodeOperations.create({
      name: name || 'QR Code',
      data: JSON.stringify(data),
      encryptedData: encryptedDataObj.encryptedData,
      signature: encryptedDataObj.signature || '',
      userId: userId || '',
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      useLimit,
      useCount: 0,
      anonymousCreation: !userId,
      verificationCode
    });

    if (!qrResult.mongoSuccess) {
      console.error("MongoDB QR code creation failed:", qrResult.mongoError);
      return NextResponse.json({ error: "حدث خطأ أثناء حفظ رمز QR" }, { status: 500 });
    }

    if (!qrResult.sqlSuccess) {
      console.warn("SQL Server QR code sync failed:", qrResult.sqlError);
    }

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      qrCodeId: qrResult.mongoSuccess ? 'generated' : undefined,
      verificationCode,
      syncStatus: qrResult
    });
    
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء توليد رمز QR" }, { status: 500 })
  }
}
