/**
 * Profile array fields are stored as JSON strings in PostgreSQL; scoring may pass parsed arrays.
 */
export function parseArray(val: string | string[] | null | undefined): string[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toArrayJson(arr: string[] | null | undefined): string {
  if (!Array.isArray(arr)) return "[]";
  return JSON.stringify(arr);
}
