import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

export interface UserToken {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function isAuthenticatedAsync(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return false;

    // Using jose which is Edge compatible instead of jsonwebtoken
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    // Verify and decode the token
    await jose.jwtVerify(token, secretKey);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getCurrentUserAsync(): Promise<UserToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    // Using jose which is Edge compatible instead of jsonwebtoken
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as UserToken;
  } catch (error) {
    return null;
  }
}

export async function generateToken(user: UserToken): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(JWT_SECRET);

  return await new jose.SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secretKey);
}
