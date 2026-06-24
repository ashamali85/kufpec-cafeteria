import { prisma } from '@/lib/db';
import { getAllowedEmailDomainsFromEnv } from '@/lib/env';

/** Read the single settings row, creating defaults on first run. */
export async function getSettings() {
  let s = await prisma.appSetting.findUnique({ where: { id: 'singleton' } });
  if (!s) {
    s = await prisma.appSetting.create({ data: { id: 'singleton' } });
  }
  return s;
}

/** Allowed signup domains: env var wins if set, else the DB setting. */
export async function getAllowedDomains(): Promise<string[]> {
  const fromEnv = getAllowedEmailDomainsFromEnv();
  if (fromEnv.length > 0) return fromEnv;
  const s = await getSettings();
  return s.allowedEmailDomains
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function emailDomainAllowed(email: string, domains: string[]) {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return domains.includes(domain);
}
