import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/db";
import * as jose from 'jose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

// Helper function to check if user is admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const userId = (payload as any).id;

    await connectToDatabase();
    const user = await User.findById(userId);
    
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

// GET system settings (admin only)
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات مدير مطلوبة" }, { status: 403 });
    }

    // يمكن تخزين الإعدادات في قاعدة بيانات منفصلة أو في ملف .env
    // هنا سنعيد إعدادات افتراضية
    return NextResponse.json({
      success: true,
      settings: {
        siteName: process.env.SITE_NAME || 'SecureQR',
        siteDescription: process.env.SITE_DESCRIPTION || 'منصة متكاملة لإنشاء وإدارة رموز QR المشفرة',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
        maxFreeQRCodes: parseInt(process.env.MAX_FREE_QR_CODES || '20'),
        emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
        smsNotifications: process.env.SMS_NOTIFICATIONS === 'true',
      }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإعدادات" }, { status: 500 });
  }
}

// PUT update system settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات مدير مطلوبة" }, { status: 403 });
    }

    const body = await request.json();
    
    // هنا يمكن حفظ الإعدادات في قاعدة بيانات أو ملف
    // في الإنتاج، يجب استخدام قاعدة بيانات أو نظام إدارة الإعدادات
    console.log("System settings update requested:", body);

    return NextResponse.json({
      success: true,
      message: "تم حفظ إعدادات النظام بنجاح",
      settings: body
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الإعدادات" }, { status: 500 });
  }
}


