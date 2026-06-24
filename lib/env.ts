/**
 * Centralised, fail-fast access to security-sensitive environment variables.
 * The JWT secret MUST be provided explicitly: a checked-in default would let
 * anyone who reads the source forge a SUPER_ADMIN session. Fail loudly instead.
 */
let cachedSecret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.trim().length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set JWT_SECRET to a random value of at least 32 characters.'
    );
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

/** Domains allowed to self-register, lower-cased. Env var overrides the DB default. */
export function getAllowedEmailDomainsFromEnv(): string[] {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS ?? '';
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}
