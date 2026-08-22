/** Short city code for ticket route display (e.g. "Mumbai" → "MUM"). */
export function cityCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z\s]/g, '').trim();
  if (!cleaned) return '—';
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return parts
      .slice(0, 3)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  }
  return cleaned.slice(0, 3).toUpperCase();
}

export function formatRouteCodes(cityNames: string[]): string {
  if (cityNames.length === 0) return '—';
  return cityNames.map(cityCode).join(' → ');
}
