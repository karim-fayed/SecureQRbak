import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/db";
import * as jose from 'jose';
import { compare, hash } from 'bcrypt';

// Secret key for JWT verification
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export async function PUT(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { name, currentPassword, newPassword, language, timezone, apiPermissions, notificationSettings, securitySettings } = body;

    // Connect to database
    await connectToDatabase();

    // Find the user
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }    // Update user information
    const updateData: any = {};

    // Only update name if provided
    if (name) {
      updateData.name = name;
    }

    // Update language if provided
    if (language) {
      updateData.language = language;
    }

    // Update timezone if provided
    if (timezone) {
      updateData.timezone = timezone;
    }

    // Update security settings if provided
    if (securitySettings) {
      updateData.securitySettings = securitySettings;
    }

    // Update API permissions if provided
    if (apiPermissions) {
      updateData.apiPermissions = apiPermissions;
    }

    // Update notification settings if provided
    if (notificationSettings) {
      updateData.notificationSettings = notificationSettings;
    }

    // Handle password change if both passwords provided
    if (currentPassword && newPassword) {
      // Verify current password
      const passwordValid = await compare(currentPassword, user.password);
      if (!passwordValid) {
        return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
      }
      
      // Hash new password
      updateData.password = await hash(newPassword, 10);
    }

    // Only update if there are changes to make
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(decoded.id, updateData);
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث الإعدادات بنجاح"
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإعدادات" }, { status: 500 });
  }
}

// Function to generate a new API key
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Verify token
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

    // Find the user and check subscription
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Check if user has premium or enterprise subscription
    const hasApiAccess = user.subscription?.plan === 'premium' || user.subscription?.plan === 'enterprise';
    
    if (!hasApiAccess) {
      return NextResponse.json({ 
        error: "مفاتيح API متاحة فقط للخطة الاحترافية وخطة المؤسسات",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    // Generate new API keys
    const publicKey = generateRandomString(8);
    const privateKey = generateUUID();

    // Update the user with new API keys
    await User.findByIdAndUpdate(decoded.id, {
      apiKeys: {
        public: publicKey,
        private: privateKey
      }
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث مفاتيح API بنجاح",
      apiKeys: {
        public: publicKey
      }
    });
  } catch (error) {
    console.error("Error regenerating API keys:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إعادة إنشاء مفاتيح API" }, { status: 500 });
  }
}

// Generate a random string for API keys
function generateRandomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate UUID
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
