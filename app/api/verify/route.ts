import { type NextRequest, NextResponse } from "next/server"
import { verifyAndDecryptQRData, verifyAndDecryptQRDataWithoutSignature, generateUUID } from "@/lib/encryption"
import { connectToDatabase, QRCode, QRCodeScan } from "@/lib/db"
import * as jose from 'jose';

// المفتاح السري للتشفير (نستخدم الآن من متغيرات البيئة)
const SECRET_KEY = process.env.API_PRIVATE_KEY || "58c5b930-923d-40ce-8f94-1ca693c20034"

export async function POST(request: NextRequest) {
  try {
    // استخراج البيانات من الطلب
    const body = await request.json()
    const { encryptedData, signature, verificationCode } = body

    // الحصول على معلومات IP و User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // التحقق من وجود البيانات المطلوبة - encryptedData مطلوب دائماً إلا إذا كان verificationCode موجود
    if (!encryptedData && !verificationCode) {
      return NextResponse.json({ error: "البيانات المشفرة أو رمز التحقق مطلوب" }, { status: 400 })
    }

    // الاتصال بقاعدة البيانات
    await connectToDatabase();

    // الحصول على معلومات المستخدم الحالي من التوكن
    let currentUserId = null;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(process.env.NEXTAUTH_SECRET || "your-default-jwt-secret");
        const { payload } = await jose.jwtVerify(token, secretKey);
        const decoded = payload as unknown as { id: string; email: string };
        currentUserId = decoded.id;
      } catch (error) {
        // Token غير صالح، نستمر بدون userId
        console.log("Invalid token in verify endpoint:", error);
      }
    }

    // إذا كان verificationCode موجود، نبحث عن الرمز مباشرة
    if (verificationCode) {
      const qrCodeDocument = await QRCode.findOne({ verificationCode });

      if (!qrCodeDocument) {
        return NextResponse.json({
          success: false,
          error: "رمز QR غير موجود في قاعدة البيانات",
          data: {
            isAuthentic: false,
            status: "رمز QR غير معروف أو من مصدر خارجي",
            note: "هذا الرمز غير مسجل في نظامنا"
          }
        }, { status: 200 });
      }

      // التحقق من صلاحيات الوصول
      const isOwner = currentUserId && qrCodeDocument.userId && qrCodeDocument.userId.toString() === currentUserId;
      const isAnonymous = qrCodeDocument.anonymousCreation;
      const hasPublicAccess = !qrCodeDocument.userId; // إذا لم يكن مرتبط بمستخدم معين


      // التحقق من التاريخ إذا كان هناك تاريخ انتهاء
      if (qrCodeDocument.expiresAt && new Date() > new Date(qrCodeDocument.expiresAt)) {
        try {
          await QRCodeScan.create({
            qrCodeId: qrCodeDocument._id,
            ipAddress,
            userAgent,
            status: 'expired',
          });
        } catch (scanError) {
          console.warn("Could not create expired scan record:", scanError);
        }

        return NextResponse.json({
          success: false,
          error: "انتهت صلاحية رمز QR",
          data: {
            isAuthentic: true,
            status: "رمز QR منتهي الصلاحية",
            expiresAt: qrCodeDocument.expiresAt,
            note: "هذا رمز أصلي ولكن انتهت صلاحيته"
          }
        }, { status: 200 });
      }

      // التحقق من حد الاستخدام
      if (qrCodeDocument.useLimit && qrCodeDocument.useCount >= qrCodeDocument.useLimit) {
        try {
          await QRCodeScan.create({
            qrCodeId: qrCodeDocument._id,
            ipAddress,
            userAgent,
            status: 'expired',
          });
        } catch (scanError) {
          console.warn("Could not create limit-exceeded scan record:", scanError);
        }

        return NextResponse.json({
          success: false,
          error: "تم تجاوز حد استخدام رمز QR",
          data: {
            isAuthentic: true,
            status: "تم تجاوز حد الاستخدام",
            useLimit: qrCodeDocument.useLimit,
            useCount: qrCodeDocument.useCount,
            note: "هذا رمز أصلي ولكن تم استخدامه الحد الأقصى من المرات"
          }
        }, { status: 200 });
      }

      // تحديث عداد الاستخدام
      qrCodeDocument.useCount += 1;
      await qrCodeDocument.save();

      // تسجيل عملية تحقق ناجحة
      try {
        await QRCodeScan.create({
          qrCodeId: qrCodeDocument._id,
          ipAddress,
          userAgent,
          status: 'valid',
        });
      } catch (scanError) {
        console.warn("Could not create success scan record:", scanError);
      }

      // إرجاع البيانات من قاعدة البيانات
      return NextResponse.json({
        success: true,
        data: {
          ...JSON.parse(qrCodeDocument.data),
          isAuthentic: true,
          status: "تم التحقق بنجاح",
          note: "تم التحقق من أن هذا الرمز أصلي وتم إنشاؤه بواسطة نظام SecureQR"
        }
      });
    }

    // التحقق من صحة البيانات وفك تشفيرها
    // إذا كان التوقيع مفقوداً، نحاول التحقق بدون توقيع (للتوافق مع البيانات القديمة)
    let result;
    if (signature) {
      result = verifyAndDecryptQRData(encryptedData, signature, SECRET_KEY);
    } else {
      result = verifyAndDecryptQRDataWithoutSignature(encryptedData, SECRET_KEY);
      // إذا فشل فك التشفير بدون توقيع، قد تكون البيانات غير مشفرة أصلاً
      if (!result.isValid) {
        // محاولة التعامل مع البيانات كـ JSON عادي (غير مشفر)
        try {
          const parsedData = JSON.parse(encryptedData);
          result = {
            isValid: true,
            tamperDetected: false,
            data: {
              ...parsedData,
              uuid: parsedData.id || generateUUID(),
              timestamp: parsedData.timestamp || new Date().toISOString(),
            }
          };
        } catch (jsonError) {
          // البيانات ليست JSON صالح، قد تكون نص عادي
          result = {
            isValid: true,
            tamperDetected: false,
            data: {
              data: encryptedData,
              uuid: generateUUID(),
              timestamp: new Date().toISOString(),
            }
          };
        }
      }
    }

    if (!result.isValid) {
      // تسجيل محاولة فاشلة - مع تجنب الخطأ عند عدم وجود qrCodeId
      try {
        // تحقق أولاً ما إذا كان يمكن الحصول على معرف QR code
        const qrId = verificationCode ? await getQRCodeIdByVerificationCode(verificationCode) : null;

        // إنشاء سجل محاولة الوصول فقط إذا كان لدينا معرف صالح
        if (qrId) {
          await QRCodeScan.create({
            qrCodeId: qrId,
            ipAddress,
            userAgent,
            status: 'invalid',
          });
        } else {
          // تسجيل بدون qrCodeId ولكن بدون إنشاء سجل في قاعدة البيانات
          console.log("Invalid QR scan without qrCodeId - no database record created");
        }
      } catch (scanError) {
        console.warn("Could not create scan record:", scanError);
        // استمر في المعالجة حتى مع وجود خطأ في التسجيل
      }

      return NextResponse.json({
        success: false,
        error: "فشل التحقق من صحة رمز QR",
        data: {
          isAuthentic: false,
          status: "رمز QR غير صالح",
          note: "فشل التحقق من أن هذا الرمز أصلي"
        }
      }, { status: 200 })
    }

    // البحث عن رمز QR باستخدام رمز التحقق أو UUID
    const uuid = result.data.uuid;
    const qrCodeDocument = verificationCode 
      ? await QRCode.findOne({ verificationCode }) 
      : await QRCode.findOne({ 'encryptedData': { $regex: uuid } });

    // التحقق من وجود الرمز
    if (!qrCodeDocument) {
      // تعامل آمن مع عدم وجود معرف QR code
      console.log("QR Code not found in database");
      
      return NextResponse.json({ 
        success: false, 
        error: "رمز QR غير موجود في قاعدة البيانات",
        data: {
          isAuthentic: false,
          status: "رمز QR غير معروف أو من مصدر خارجي",
          note: "هذا الرمز غير مسجل في نظامنا"
        }
      }, { status: 200 }); // استخدام 200 بدلاً من 404 للسماح بعرض نتيجة للمستخدم
    }

    // التحقق من التاريخ إذا كان هناك تاريخ انتهاء
    if (qrCodeDocument.expiresAt && new Date() > new Date(qrCodeDocument.expiresAt)) {
      try {
        await QRCodeScan.create({
          qrCodeId: qrCodeDocument._id,
          ipAddress,
          userAgent,
          status: 'expired',
        });
      } catch (scanError) {
        console.warn("Could not create expired scan record:", scanError);
      }
      
      return NextResponse.json({ 
        success: false,
        error: "انتهت صلاحية رمز QR",
        data: {
          isAuthentic: true,
          status: "رمز QR منتهي الصلاحية",
          expiresAt: qrCodeDocument.expiresAt,
          note: "هذا رمز أصلي ولكن انتهت صلاحيته"
        }
      }, { status: 200 });
    }

    // التحقق من حد الاستخدام
    if (qrCodeDocument.useLimit && qrCodeDocument.useCount >= qrCodeDocument.useLimit) {
      try {
        await QRCodeScan.create({
          qrCodeId: qrCodeDocument._id,
          ipAddress,
          userAgent,
          status: 'expired',
        });
      } catch (scanError) {
        console.warn("Could not create limit-exceeded scan record:", scanError);
      }
      
      return NextResponse.json({ 
        success: false,
        error: "تم تجاوز حد استخدام رمز QR",
        data: {
          isAuthentic: true,
          status: "تم تجاوز حد الاستخدام",
          useLimit: qrCodeDocument.useLimit,
          useCount: qrCodeDocument.useCount,
          note: "هذا رمز أصلي ولكن تم استخدامه الحد الأقصى من المرات"
        }
      }, { status: 200 });
    }

    // تحديث عداد الاستخدام
    qrCodeDocument.useCount += 1;
    await qrCodeDocument.save();

    // تسجيل عملية تحقق ناجحة
    try {
      await QRCodeScan.create({
        qrCodeId: qrCodeDocument._id,
        ipAddress,
        userAgent,
        status: 'valid',
      });
    } catch (scanError) {
      console.warn("Could not create success scan record:", scanError);
      // استمر في المعالجة حتى مع وجود خطأ في التسجيل
    }

    // إرجاع البيانات المفكوكة التشفير
    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        isAuthentic: true,
        status: "تم التحقق بنجاح",
        note: "تم التحقق من أن هذا الرمز أصلي وتم إنشاؤه بواسطة نظام SecureQR"
      }
    })
  } catch (error) {
    console.error("Error verifying QR code:", error)
    return NextResponse.json({ 
      success: false,
      error: "حدث خطأ أثناء التحقق من رمز QR",
      isServerError: true
    }, { status: 200 })
  }
}

// وظيفة مساعدة للبحث عن معرف QR بناءً على رمز التحقق
async function getQRCodeIdByVerificationCode(verificationCode: string) {
  try {
    const qrCode = await QRCode.findOne({ verificationCode });
    return qrCode ? qrCode._id : null;
  } catch {
    return null;
  }
}
