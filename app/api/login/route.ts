import { type NextRequest, NextResponse } from "next/server";
import { userOperations } from "@/lib/database-abstraction";
import { compare } from "bcrypt";
import * as jose from "jose";

// Secret key for JWT signing
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
    }

    // Find user using dual database operations (read with fallback)
    const userResult = await userOperations.findByEmail(email);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: "بيانات الاعتماد غير صالحة" }, { status: 401 });
    }

    const user = userResult.data;

    // Verify password
    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "بيانات الاعتماد غير صالحة" }, { status: 401 });
    }
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
      const token = await new jose.SignJWT({
      id: user._id.toString(),
      email: user.email,
      role: user.role || 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d') // زيادة مدة انتهاء الصلاحية إلى 30 يومًا
      .sign(secretKey);
        // Check if user has premium or enterprise subscription to show API keys
    const hasApiAccess = user.subscription?.plan === 'premium' || user.subscription?.plan === 'enterprise';
    
    // Set cookie with token
    const response = NextResponse.json({
      success: true,
      token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription || { plan: 'free', status: 'active' },
        apiKeys: hasApiAccess ? {
          public: user.apiKeys?.public
        } : undefined
      }
    });

    // تحسين إعدادات ملف تعريف الارتباط لإطالة مدة الجلسة وضمان استمراريتها
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      // استخدام فترة أطول للجلسة (30 يومًا)
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === "production",
    });
    
    // طباعة تسجيل دخول للتأكد من تعيين ملف تعريف الارتباط
    console.log("Login successful, token set for user:", user.email);

    return response;
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}
