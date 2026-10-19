function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const avClass = (name: string) => `av-${(hash(name) % 8) + 1}`;

export function initials(name: string): string {
  const base = name.replace(/[0-9]+$/, '');
  const parts = base.split('_').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || name).slice(0, 2).toUpperCase();
}
