import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-default-jwt-secret";

// Paths that require authentication (except /dashboard/create)
const protectedPaths = [
  '/api/qrcodes',
  // '/dashboard', // We'll handle dashboard manually below
];

// Paths that should redirect authenticated users (like login page)
const authRedirectPaths = [
  '/login',
  '/register',
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // Special case: allow /dashboard/create for everyone
  if (path === '/dashboard/create') {
    return NextResponse.next();
  }

  // For protected paths, redirect to login if not authenticated
  if (isProtectedPath(path) && !isAuthenticated) {
    // تخزين مسار الإعادة التوجيه في ملف تعريف الارتباط للعودة إليه بعد تسجيل الدخول
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('redirect-after-login', path, {
      path: '/',
      maxAge: 60 * 5, // 5 دقائق
      httpOnly: true
    });
    // Clear invalid auth-token cookie
    response.cookies.delete('auth-token');
    return response;
  }

  // Protect all /dashboard/* except /dashboard/create
  if (path.startsWith('/dashboard') && path !== '/dashboard/create' && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('redirect-after-login', path, {
      path: '/',
      maxAge: 60 * 5, // 5 دقائق
      httpOnly: true
    });
    // Clear invalid auth-token cookie
    response.cookies.delete('auth-token');
    return response;
  }

  // Protect all /admin/* paths - require authentication
  if (path.startsWith('/admin') && !isAuthenticated) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('redirect-after-login', path, {
      path: '/',
      maxAge: 60 * 5,
      httpOnly: true
    });
    // Clear invalid auth-token cookie
    response.cookies.delete('auth-token');
    return response;
  }

  // Protect all /api/admin/* paths - require authentication (admin check is done in route)
  if (path.startsWith('/api/admin') && !isAuthenticated) {
    const response = NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    // Clear invalid auth-token cookie
    response.cookies.delete('auth-token');
    return response;
  }

  // For login/register, redirect to dashboard if already authenticated
  if (isAuthRedirectPath(path) && isAuthenticated) {
    // التحقق من وجود مسار إعادة توجيه محفوظ
    const redirectPath = request.cookies.get('redirect-after-login')?.value || '/dashboard';
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    // مسح ملف تعريف ارتباط إعادة التوجيه بعد استخدامه
    response.cookies.delete('redirect-after-login');
    return response;
  }

  return NextResponse.next();
}

// Function to verify JWT token
async function verifyToken(token: string): Promise<boolean> {
  try {
    // Using jose which is Edge compatible instead of jsonwebtoken
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    // Verify and decode the token
    await jose.jwtVerify(token, secretKey);
    console.log('Token verified successfully with jose');
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// Check if the path matches any protected path
function isProtectedPath(path: string): boolean {
  return protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
}

// Check if the path matches any auth redirect path
function isAuthRedirectPath(path: string): boolean {
  return authRedirectPaths.some(authPath => 
    path === authPath || path.startsWith(`${authPath}/`)
  );
}

// Configure the paths which should be processed by this middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/qrcodes/:path*',
    '/api/admin/:path*',
    '/login',
    '/register',
  ],
};
