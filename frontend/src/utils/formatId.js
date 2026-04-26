/**
 * Mask a reference ID for display, showing only the last 4 characters.
 * Example: 84629173 → "****9173"
 */
export function maskReferenceId(refId) {
  if (!refId) return '';
  const str = String(refId);
  if (str.length <= 4) return str;
  return '****' + str.slice(-4);
}
