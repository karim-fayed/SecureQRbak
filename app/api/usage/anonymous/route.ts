import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, AnonymousUsage } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  await connectToDatabase();
  const usage = await AnonymousUsage.findOne({ ipAddress });
  return NextResponse.json({
    usageCount: usage ? usage.count : 0,
    limit: 20
  });
}
