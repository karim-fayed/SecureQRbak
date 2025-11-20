import { type NextRequest, NextResponse } from "next/server";
import { qrCodeOperations } from "@/lib/database-abstraction";
import * as jose from 'jose';

// Secret key for JWT verification
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Verify token using jose (Edge compatible)
    let decoded;
    try {
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(JWT_SECRET);

      const { payload } = await jose.jwtVerify(token, secretKey);
      decoded = payload as unknown as { id: string; email: string };
    } catch (error) {
      return NextResponse.json({ error: "رمز مصادقة غير صالح" }, { status: 401 });
    }

    // Get user QR codes using dual database operations (read with fallback)
    const qrCodesResult = await qrCodeOperations.findByUserId(decoded.id);
    if (!qrCodesResult.success) {
      console.error("Failed to fetch QR codes:", qrCodesResult.error);
      return NextResponse.json({ error: "حدث خطأ أثناء استرداد رموز QR" }, { status: 500 });
    }

    // Filter out encrypted data and sort by creation date
    const qrCodes = (qrCodesResult.data || [])
      .filter(qr => qr.encryptedData !== undefined) // Remove encrypted data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      qrCodes,
      source: qrCodesResult.source // Indicate which database was used
    });
  } catch (error) {
    console.error("Error getting QR codes:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء استرداد رموز QR" }, { status: 500 });
  }
}
