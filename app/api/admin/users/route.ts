import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/db";
import * as jose from 'jose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

// Helper function to check if user is admin
async function isAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return { isAdmin: false };
  }

  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const userId = (payload as any).id;

    await connectToDatabase();
    const user = await User.findById(userId);
    
    return {
      isAdmin: user?.role === 'admin',
      userId: userId
    };
  } catch {
    return { isAdmin: false };
  }
}

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات مدير مطلوبة" }, { status: 403 });
    }

    await connectToDatabase();

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        subscription: user.subscription || { plan: 'free', status: 'active' },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المستخدمين" }, { status: 500 });
  }
}


