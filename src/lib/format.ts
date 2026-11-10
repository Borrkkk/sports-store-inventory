export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type NameParts = {
  brand: string;
  sport: string;
  color: string;
  category: string;
};

function namePart(value: string): string {
  return value
    .trim()
    .replace(/[^0-9A-Za-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function productName(parts: NameParts): string {
  return [parts.brand, parts.sport, parts.color, parts.category].map(namePart).filter(Boolean).join('-');
}

export function makeImageName(parts: NameParts, id: string): string {
  const name = (productName(parts) || 'item').slice(0, 160);
  const suffix = id.replace(/[^0-9A-Za-z]/g, '').slice(-6) || 'item';
  return `${name}-${suffix}.jpg`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Try again.';
}

export function oneParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
