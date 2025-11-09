import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User, PasswordResetRequest } from "@/lib/db";
import * as crypto from 'crypto';
import { sendPasswordResetNotificationToAdmin, sendPasswordResetLinkToUser } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "إذا كان البريد الإلكتروني مسجل في النظام، سيتم إرسال إشعار للمالك لمراجعة الطلب"
      });
    }

    // Check if there's already a pending request for this user
    const existingRequest = await PasswordResetRequest.findOne({
      userId: user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: "لديك طلب إعادة تعيين كلمة مرور معلق بالفعل. يرجى انتظار موافقة المالك."
      });
    }

    // Create password reset request
    const resetRequest = new PasswordResetRequest({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      status: 'pending',
      requestedAt: new Date(),
    });

    await resetRequest.save();

    // Send notification to admin/owner about the password reset request
    console.log(`Password reset request created for user: ${user.email} (${user.name})`);

    // Send email notification to admin
    const emailSent = await sendPasswordResetNotificationToAdmin(
      user.name,
      user.email,
      resetRequest._id.toString()
    );

    if (emailSent) {
      console.log(`Admin notification sent successfully for user: ${user.email}`);
      return NextResponse.json({
        success: true,
        message: "تم إرسال طلب إعادة تعيين كلمة المرور بنجاح. سيتم إشعار المالك لمراجعة الطلب."
      });
    } else {
      console.error(`Failed to send admin notification for user: ${user.email}`);
      // Delete the request if email fails
      await PasswordResetRequest.findByIdAndDelete(resetRequest._id);
      return NextResponse.json(
        { error: "فشل في إرسال الإشعار للمالك. يرجى المحاولة مرة أخرى." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error creating password reset request:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
