import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, PasswordResetRequest, User } from "@/lib/db";
import * as jose from 'jose';
import * as crypto from 'crypto';
import { sendNewPasswordToUser, sendPasswordResetLinkToUser } from "@/lib/email-service";

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

// POST approve password reset request
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
      return NextResponse.json({ error: "لا يمكن الموافقة على هذا الطلب" }, { status: 400 });
    }

    // Get current user password for potential rollback
    const user = await User.findById(resetRequest.userId);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    const oldPassword = user.password;

    // Generate new password
    const newPassword = crypto.randomBytes(8).toString('hex');

    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await User.findByIdAndUpdate(resetRequest.userId, {
      password: hashedPassword
    });

    // Update request status
    await PasswordResetRequest.findByIdAndUpdate(id, {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminCheck.userId,
      notes: `تم إعادة تعيين كلمة المرور الجديدة: ${newPassword}`,
    });

    // Send email to user with new password
    const emailSent = await sendNewPasswordToUser(
      resetRequest.userEmail,
      resetRequest.userName,
      newPassword
    );

    if (emailSent) {
      console.log(`New password sent successfully to user: ${resetRequest.userEmail}`);
      return NextResponse.json({
        success: true,
        message: "تمت الموافقة على الطلب وإعادة تعيين كلمة المرور",
        emailSent: emailSent
      });
    } else {
      console.error(`Failed to send new password to user: ${resetRequest.userEmail}`);
      // Revert the password change if email fails
      await User.findByIdAndUpdate(resetRequest.userId, {
        password: oldPassword
      });
      // Actually, we should store the old password or revert properly
      // For now, we'll mark the request as failed
      await PasswordResetRequest.findByIdAndUpdate(id, {
        status: 'failed',
        notes: 'فشل في إرسال البريد الإلكتروني للمستخدم'
      });
      return NextResponse.json(
        { error: "تم إعادة تعيين كلمة المرور لكن فشل في إرسال البريد الإلكتروني للمستخدم" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error approving password reset request:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
