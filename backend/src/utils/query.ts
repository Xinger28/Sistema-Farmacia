import { ParsedQs } from 'qs';

export function parseQueryString(value: string | ParsedQs | (string | ParsedQs)[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return String(value[0]);
  if (value && typeof value === 'object') return String(value);
  return undefined;
}

export function parseIntQuery(value: string | ParsedQs | (string | ParsedQs)[] | undefined): number | undefined {
  const str = parseQueryString(value);
  if (str === undefined) return undefined;
  const num = parseInt(str);
  return isNaN(num) ? undefined : num;
}
