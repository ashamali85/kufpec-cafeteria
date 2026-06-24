import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPrefixes = ['/menu', '/cart', '/orders', '/profile', '/wallet', '/admin', '/super'];

/**
 * Edge middleware: cheap signature check to bounce anonymous traffic away from
 * authenticated areas. Authoritative role checks happen in server actions and
 * pages via getSessionUser(); this only verifies the cookie is a valid token.
 */
function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.trim().length < 32) {
    throw new Error('JWT_SECRET is missing or too short (min 32 characters).');
  }
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get('kufpec_cafeteria_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/menu/:path*', '/cart/:path*', '/orders/:path*', '/profile/:path*', '/wallet/:path*', '/admin/:path*', '/super/:path*']
};
