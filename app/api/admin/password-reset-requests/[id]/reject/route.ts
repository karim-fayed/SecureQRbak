import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, PasswordResetRequest } from "@/lib/db";
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
    const userRole = (payload as any).role;

    return {
      isAdmin: userRole === 'admin',
      userId: userId
    };
  } catch {
    return { isAdmin: false };
  }
}

// POST reject password reset request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await isAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات مدير مطلوبة" }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = await params;

    // Find the request
    const resetRequest = await PasswordResetRequest.findById(id);
    if (!resetRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (resetRequest.status !== 'pending') {
      return NextResponse.json({ error: "لا يمكن رفض هذا الطلب" }, { status: 400 });
    }

    // Update request status
    await PasswordResetRequest.findByIdAndUpdate(id, {
      status: 'rejected',
      approvedAt: new Date(),
      approvedBy: adminCheck.userId,
      notes: 'تم رفض الطلب من قبل المالك',
    });

    return NextResponse.json({
      success: true,
      message: "تم رفض الطلب بنجاح"
    });

  } catch (error) {
    console.error("Error rejecting password reset request:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
