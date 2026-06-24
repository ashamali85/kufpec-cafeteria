/** Build a deterministic avatar URL for a user with no uploaded picture. */
export function placeholderAvatar(name: string) {
  const encoded = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${encoded}&background=0B5D3B&color=fff`;
}

/** Coerce a possibly-missing FormData string to a trimmed string. */
export function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

export function getInt(formData: FormData, key: string, fallback = 0) {
  const n = parseInt(getString(formData, key), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Format a Date as a readable timestamp, e.g. "24 Jun 2026, 19:40". */
export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);
}
