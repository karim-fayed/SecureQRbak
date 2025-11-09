import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, QRCode } from "@/lib/db";
import * as jose from 'jose';
import mongoose from "mongoose";

// Secret key for JWT verification
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "معرف QR غير صالح" }, { status: 400 });
    }

    // Get auth token
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }    // Verify token using jose (Edge compatible)
    let decoded;
    try {
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(JWT_SECRET);
      
      const { payload } = await jose.jwtVerify(token, secretKey);
      decoded = payload as unknown as { id: string; email: string };
    } catch (error) {
      return NextResponse.json({ error: "رمز مصادقة غير صالح" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Find QR code and verify ownership
    const qrCode = await QRCode.findById(id);
    if (!qrCode) {
      return NextResponse.json({ error: "رمز QR غير موجود" }, { status: 404 });
    }

    // Check if the user owns the QR code
    if (qrCode.userId.toString() !== decoded.id) {
      return NextResponse.json({ error: "غير مصرح لك بحذف رمز QR هذا" }, { status: 403 });
    }

    // Delete the QR code
    await QRCode.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "تم حذف رمز QR بنجاح"
    });
  } catch (error) {
    console.error("Error deleting QR code:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف رمز QR" }, { status: 500 });
  }
}
