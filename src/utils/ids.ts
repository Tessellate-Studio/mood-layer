/**
 * Dependency-free UUID v4. Math.random is fine here: these ids only need to
 * be unique within one person's on-device data (local-only rule), never
 * across users or for anything security-sensitive.
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
