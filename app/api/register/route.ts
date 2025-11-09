import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase, User } from "@/lib/db";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل بالفعل" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user with free plan (API keys only for premium/enterprise)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      subscription: {
        plan: 'free',
        status: 'active'
      }
      // API keys are only created for premium/enterprise users
    });

    // Return success without sensitive data
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription
        // Don't return API keys for free users
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
