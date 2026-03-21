/**
 * SQLite stores arrays as JSON strings. Helpers to convert for Profile fields.
 */
export function parseArray(val: string | null | undefined): string[] {
  if (val == null) return [];
  if (typeof val !== "string") return Array.isArray(val) ? val : [];
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
