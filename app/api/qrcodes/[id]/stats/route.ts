import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, QRCodeScan } from "@/lib/db";
import * as jose from 'jose';
import mongoose from "mongoose";

// Secret key for JWT verification
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get scan statistics
    const totalScans = await QRCodeScan.countDocuments({ qrCodeId: id });
    const validScans = await QRCodeScan.countDocuments({ qrCodeId: id, status: 'valid' });
    const invalidScans = await QRCodeScan.countDocuments({ qrCodeId: id, status: 'invalid' });
    const expiredScans = await QRCodeScan.countDocuments({ qrCodeId: id, status: 'expired' });

    // Get recent scans
    const recentScans = await QRCodeScan.find({ qrCodeId: id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get daily scan counts for the past 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dailyScans = await QRCodeScan.aggregate([
      {
        $match: {
          qrCodeId: new mongoose.Types.ObjectId(id),
          createdAt: { $gte: thirtyDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 },
          validCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "valid"] }, 1, 0]
            }
          },
          invalidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "invalid"] }, 1, 0]
            }
          },
          expiredCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "expired"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    // Transform to a more usable format
    const dailyScanData = dailyScans.map(item => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      total: item.count,
      valid: item.validCount,
      invalid: item.invalidCount,
      expired: item.expiredCount
    }));

    return NextResponse.json({
      success: true,
      stats: {
        total: totalScans,
        valid: validScans,
        invalid: invalidScans,
        expired: expiredScans
      },
      recentScans,
      dailyScans: dailyScanData
    });
  } catch (error) {
    console.error("Error getting scan statistics:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء استرداد إحصائيات المسح" }, { status: 500 });
  }
}
