import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, PasswordResetRequest } from "@/lib/db";
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
    const userRole = (payload as any).role;

    return userRole === 'admin';
  } catch {
    return false;
  }
}

// GET all password reset requests (admin only)
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات مدير مطلوبة" }, { status: 403 });
    }

    // Use dual database operations - get all requests (no filter for admin view)
    // Note: We need to implement findAll for password reset requests or use findByUserId with empty filter
    // For now, we'll use a workaround by getting requests for a dummy user ID and then getting all
    // TODO: Add findAll method to passwordResetOperations

    // Since we don't have findAll yet, we'll use direct database access for admin operations
    // This will be updated once findAll is implemented
    const { connectToDatabase, PasswordResetRequest } = await import("@/lib/db");
    await connectToDatabase();

    const requests = await PasswordResetRequest.find({})
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests: requests.map(req => ({
        _id: req._id,
        userName: req.userName,
        userEmail: req.userEmail,
        status: req.status,
        requestedAt: req.requestedAt,
        approvedAt: req.approvedAt,
        approvedBy: req.approvedBy?.name,
        notes: req.notes,
      }))
    });
  } catch (error) {
    console.error("Error fetching password reset requests:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلبات" }, { status: 500 });
  }
}
