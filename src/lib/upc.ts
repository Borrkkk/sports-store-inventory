export function normalizeUpc(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');
  const compact = trimmed.replace(/\s/g, '');
  const numeric = digits.length > 0 && digits.length === compact.length;
  if (!numeric) return trimmed;

  // Scanners often report a UPC-A as a 13-digit EAN with a leading zero.
  if (digits.length === 13 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function upcsMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const left = normalizeUpc(a);
  const right = normalizeUpc(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const asEan = (value: string) => (value.length === 12 ? `0${value}` : value);
  return asEan(left) === asEan(right);
}
