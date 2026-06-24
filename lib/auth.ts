import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getJwtSecret } from '@/lib/env';

const COOKIE_NAME = 'kufpec_cafeteria_session';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balanceFils: number;
};

/**
 * The JWT carries only the user id. Role, active status, and balance are looked
 * up from the database on every request, so deactivating a user or changing a
 * role takes effect immediately rather than after the token expires.
 */
type SessionToken = { sub: string; tv: number };

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return toSessionUser(user);
}

function toSessionUser(user: {
  id: string; name: string; email: string; role: UserRole; balanceFils: number;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balanceFils: user.balanceFils
  };
}

export async function createSession(user: Pick<SessionUser, 'id'>) {
  const token = await new SignJWT({ tv: 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = (payload as Partial<SessionToken>).sub;
    if (typeof sub !== 'string' || !sub) return null;
    userId = sub;
  } catch {
    return null;
  }

  // Authoritative lookup: never trust role/balance from the token itself.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;
  return toSessionUser(user);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireEmployee() {
  const user = await requireUser();
  // Admins can also browse, but this guard is for employee-only pages.
  return user;
}

export async function requireCafeteriaAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.CAFETERIA_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    redirect('/menu');
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.SUPER_ADMIN) redirect('/menu');
  return user;
}

export { COOKIE_NAME };
