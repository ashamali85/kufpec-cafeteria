import { UserRole } from '@prisma/client';
import type { SessionUser } from '@/lib/auth';

export function isSuperAdmin(user: SessionUser) {
  return user.role === UserRole.SUPER_ADMIN;
}

export function isCafeteriaAdmin(user: SessionUser) {
  return user.role === UserRole.CAFETERIA_ADMIN || user.role === UserRole.SUPER_ADMIN;
}

export function isEmployee(user: SessionUser) {
  return user.role === UserRole.EMPLOYEE;
}
