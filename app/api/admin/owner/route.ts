import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/db";
import * as jose from 'jose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";
const OWNER_EMAIL = 'karim-it@outlook.sa';

// Helper function to check if user is the owner
async function isOwner(request: NextRequest): Promise<{ isOwner: boolean; userId?: string }> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return { isOwner: false };
  }

  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const userId = (payload as any).id;

    await connectToDatabase();
    const user = await User.findById(userId);
    
    return {
      isOwner: user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
      userId: userId
    };
  } catch {
    return { isOwner: false };
  }
}

// GET owner info (owner only)
export async function GET(request: NextRequest) {
  try {
    const ownerCheck = await isOwner(request);
    if (!ownerCheck.isOwner) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات المالك مطلوبة" }, { status: 403 });
    }

    await connectToDatabase();
    const owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase() }).select('-password');

    if (!owner) {
      return NextResponse.json({ error: "المالك غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        subscription: owner.subscription,
        createdAt: owner.createdAt
      },
      privileges: {
        canManageUsers: true,
        canManageSystem: true,
        canManageSubscriptions: true,
        canViewLogs: true,
        canManageSettings: true,
        fullAccess: true
      }
    });
  } catch (error) {
    console.error("Error fetching owner info:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب معلومات المالك" }, { status: 500 });
  }
}


