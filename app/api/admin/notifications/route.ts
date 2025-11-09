import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, PasswordResetRequest } from "@/lib/db";
import * as jose from 'jose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const userId = (payload as any).id;
    const userRole = (payload as any).role;

    if (!userId || userRole !== 'admin') {
      return NextResponse.json(
        { error: "ليس لديك صلاحية للوصول إلى هذا المورد" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // جلب طلبات إعادة تعيين كلمة المرور المعلقة
    const pendingRequests = await PasswordResetRequest.find({
      status: 'pending'
    })
    .select('userName userEmail requestedAt')
    .sort({ requestedAt: -1 })
    .limit(10);

    // إحصائيات الإشعارات
    const totalPending = await PasswordResetRequest.countDocuments({ status: 'pending' });
    const totalApproved = await PasswordResetRequest.countDocuments({ status: 'approved' });
    const totalRejected = await PasswordResetRequest.countDocuments({ status: 'rejected' });

    return NextResponse.json({
      success: true,
      notifications: {
        passwordResetRequests: pendingRequests.map(req => ({
          id: req._id,
          type: 'password_reset_request',
          title: `طلب إعادة تعيين كلمة مرور من ${req.userName}`,
          message: `المستخدم ${req.userName} (${req.userEmail}) يطلب إعادة تعيين كلمة مرور`,
          timestamp: req.requestedAt,
          userName: req.userName,
          userEmail: req.userEmail,
        }))
      },
      stats: {
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        total: totalPending + totalApproved + totalRejected
      }
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإشعارات" },
      { status: 500 }
    );
  }
}

// POST endpoint to send batch notifications (for testing)
export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "قائمة البريد الإلكتروني مطلوبة" },
        { status: 400 }
      );
    }

    // التحقق من المصادقة
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    const userRole = (payload as any).role;

    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "ليس لديك صلاحية للوصول إلى هذا المورد" },
        { status: 403 }
      );
    }

    // إرسال الإشعارات على دفعات صغيرة
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      const batchPromises = batch.map(async (email: string) => {
        try {
          // Simulate sending notification
          console.log(`Sending notification to: ${email}`);
          // Here you would call your email service
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
          return { email, success: true };
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { email, success: false, error: errorMessage };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Wait between batches to avoid rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${successful} إشعار بنجاح، فشل ${failed}`,
      results
    });

  } catch (error) {
    console.error("Error sending batch notifications:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الإشعارات" },
      { status: 500 }
    );
  }
}
