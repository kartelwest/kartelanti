export function generateId(prefix = ''): string {
  const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  return prefix ? `${prefix}-${base}` : base;
}
