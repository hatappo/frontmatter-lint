/**
 * Get the actual type name of a value for error messages
 *
 * @param value - Value to get type of
 * @returns Type name string
 */
export function getActualType(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
