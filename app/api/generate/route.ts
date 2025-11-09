import { type NextRequest, NextResponse } from "next/server"
import { generateQRCode } from "@/lib/qr-generator"
import { connectToDatabase, QRCode as QRCodeModel, AnonymousUsage } from "@/lib/db"
import { createEncryptedQRData, generateUUID } from "@/lib/encryption"
import mongoose from "mongoose"

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
    
    // الاتصال بقاعدة البيانات
    await connectToDatabase();

    // التحقق من المستخدم - إذا لم يكن هناك مستخدم، فهذا استخدام مجاني
    if (!userId) {
      // تحقق من عدد مرات الاستخدام المجاني للمستخدم المجهول
      const anonymousUser = await AnonymousUsage.findOne({ ipAddress });
      
      if (anonymousUser) {
        // إذا تجاوز الحد الأقصى للاستخدام المجاني
        if (anonymousUser.count >= FREE_USAGE_LIMIT) {
          return NextResponse.json({ 
            error: "لقد تجاوزت الحد الأقصى للاستخدام المجاني. يرجى إنشاء حساب للمتابعة.", 
            limitReached: true,
            usageCount: anonymousUser.count
          }, { status: 403 });
        }
        
        // تحديث عدد مرات الاستخدام
        anonymousUser.count += 1;
        anonymousUser.lastUsed = new Date();
        await anonymousUser.save();
      } else {
        // إنشاء سجل جديد للمستخدم المجهول
        await AnonymousUsage.create({
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
    
    // الاتصال بقاعدة البيانات
    await connectToDatabase();
    
    // إنشاء كود تحقق
    const verificationCode = generateUUID().substring(0, 8);
    
    // تخزين معلومات رمز QR في قاعدة البيانات
    const qrCode = await QRCodeModel.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined, // يمكن أن يكون غير محدد للمستخدمين غير المسجلين
      name: name || 'QR Code',
      description: description,
      data: JSON.stringify(data),
      encryptedData: encryptedDataObj.encryptedData,
      verificationCode: verificationCode,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      useLimit: useLimit,
      useCount: 0,
      anonymousCreation: !userId ? true : false, // علامة تشير إلى أنه تم إنشاؤه بواسطة مستخدم غير مسجل
    });

    // إرجاع رمز QR كاستجابة
    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      qrCodeId: qrCode._id,
      verificationCode: verificationCode,
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء توليد رمز QR" }, { status: 500 })
  }
}
