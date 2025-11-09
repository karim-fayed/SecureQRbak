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

// GET specific user (admin only)
export async function GET(
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
    const user = await User.findById(id).select('-password');
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        subscription: user.subscription || { plan: 'free', status: 'active' },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات المستخدم" }, { status: 500 });
  }
}

// PUT update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await isAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "غير مصرح - صلاحيات مدير مطلوبة" }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, subscription } = body;

    await connectToDatabase();

    const { id } = await params;

    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (role && ['user', 'admin'].includes(role)) {
      updateData.role = role;
    }

    if (subscription) {
      updateData.subscription = {
        plan: subscription.plan || 'free',
        status: subscription.status || 'active',
        expiresAt: subscription.expiresAt ? new Date(subscription.expiresAt) : undefined
      };
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث المستخدم بنجاح",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        subscription: user.subscription || { plan: 'free', status: 'active' }
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث المستخدم" }, { status: 500 });
  }
}

// DELETE user (admin only)
export async function DELETE(
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
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المستخدم بنجاح"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف المستخدم" }, { status: 500 });
  }
}


