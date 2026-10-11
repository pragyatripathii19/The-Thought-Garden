/**
 * Returns the calendar day (YYYY-MM-DD) of a moment in the user's local time zone.
 *
 * Use this instead of `toISOString().slice(0, 10)`, which gives the UTC day:
 * in IST, for example, a thought planted at 00:30 would otherwise count as the
 * previous day.
 */
export function localDateKey(value: Date | string | number = new Date()): string {
  const d = value instanceof Date ? value : new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
