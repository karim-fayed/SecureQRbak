import { NextRequest, NextResponse } from "next/server";
import { testEmailConnection } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const isConnected = await testEmailConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: "Email service is connected and ready"
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Email service configuration error"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error testing email connection:", error);
    return NextResponse.json(
      { error: "Failed to test email connection" },
      { status: 500 }
    );
  }
}
