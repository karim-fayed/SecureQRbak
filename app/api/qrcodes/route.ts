import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, QRCode } from "@/lib/db";
import * as jose from 'jose';

// Secret key for JWT verification
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function GET(request: NextRequest) {
  try {
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

    // Get user QR codes
    const qrCodes = await QRCode.find({ userId: decoded.id })
      .select('-encryptedData') // Don't include the encrypted data
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      qrCodes
    });
  } catch (error) {
    console.error("Error getting QR codes:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء استرداد رموز QR" }, { status: 500 });
  }
}
