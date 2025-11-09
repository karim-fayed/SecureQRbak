import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/db";
import * as jose from 'jose';
import mongoose from "mongoose";

// Secret key for JWT verification
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Verify token using jose (Edge compatible)
    let decoded;
    try {
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(JWT_SECRET);

      const { payload } = await jose.jwtVerify(token, secretKey);
      decoded = payload as unknown as { id: string; email: string };
    } catch (error) {
      // Clear invalid auth-token cookie
      const response = NextResponse.json({ error: "رمز مصادقة غير صالح" }, { status: 401 });
      response.cookies.delete('auth-token');
      return response;
    }

    // Connect to database
    await connectToDatabase();

    // Get user data (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Get QR codes count
    const qrCodesCount = await mongoose.models.QRCode.countDocuments({ userId: decoded.id });

    // Check if user has premium or enterprise subscription to show API keys
    const hasApiAccess = user.subscription?.plan === 'premium' || user.subscription?.plan === 'enterprise';
    
    // Return user data and stats
    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        subscription: user.subscription || { plan: 'free', status: 'active' },
        apiKeys: hasApiAccess ? {
          public: user.apiKeys?.public
        } : undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      stats: {
        qrCodesCount: qrCodesCount
      }
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات المستخدم" }, { status: 500 });
  }
}
