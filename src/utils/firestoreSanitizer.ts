/**
 * Utility to sanitize objects and arrays before writing to Firebase Firestore.
 * Firestore strictly throws an error if any field value or nested property is `undefined`.
 * This helper recursively removes `undefined` properties from objects, and converts
 * `undefined` items in arrays to `null`.
 */
export function cleanForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as unknown as T;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => (item === undefined ? null : cleanForFirestore(item))) as unknown as T;
  }
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      res[k] = cleanForFirestore(v);
    }
  }
  return res as T;
}
