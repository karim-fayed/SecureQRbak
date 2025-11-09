import { type NextRequest, NextResponse } from "next/server";

// مشترك بين الوظيفتين لتفادي تكرار الكود
function handleLogout() {
  // Create response
  const response = NextResponse.json({
    success: true,
    message: "تم تسجيل الخروج بنجاح",
  });

  // Clear auth cookie
  response.cookies.delete("auth-token");
  
  // تنظيف كوكي إعادة التوجيه إذا كان موجوداً
  response.cookies.delete("redirect-after-login");

  return response;
}

// دعم طلبات POST (المفضلة)
export async function POST() {
  return handleLogout();
}

// دعم طلبات GET (كبديل)
export async function GET() {
  return handleLogout();
}
