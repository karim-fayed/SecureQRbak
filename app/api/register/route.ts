import { type NextRequest, NextResponse } from "next/server";
import { userOperations } from "@/lib/database-abstraction";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user using dual database operations
    const result = await userOperations.create({
      name,
      email,
      password: hashedPassword,
      subscription: {
        plan: 'free',
        features: []
      }
      // API keys are only created for premium/enterprise users
    });

    // Check if MongoDB operation succeeded
    if (!result.mongoSuccess) {
      console.error("MongoDB user creation failed:", result.mongoError);
      return NextResponse.json({ error: "حدث خطأ أثناء تسجيل المستخدم" }, { status: 500 });
    }

    // Log SQL Server sync status
    if (!result.sqlSuccess) {
      console.warn("SQL Server user sync failed:", result.sqlError);
      // Continue with success since MongoDB succeeded
    }

    // Return success without sensitive data
    return NextResponse.json({
      success: true,
      message: "تم تسجيل المستخدم بنجاح",
      user: {
        name,
        email,
        subscription: {
          plan: 'free'
        }
      },
      syncStatus: {
        mongoSuccess: result.mongoSuccess,
        sqlSuccess: result.sqlSuccess
      }
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل المستخدم" }, { status: 500 });
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
