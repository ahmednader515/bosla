export function splitDateTimeLocal(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date, timePart] = value.split("T");
  return { date: date ?? "", time: (timePart ?? "").slice(0, 5) };
}

export function combineDateTimeLocal(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

/** Format a Date/ISO string for split date/time fields using the browser's local timezone. */
export function toDateTimeLocalValue(isoOrDate: Date | string): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** Convert a datetime-local value (YYYY-MM-DDTHH:mm) to UTC ISO for API storage. */
export function dateTimeLocalToIso(localValue: string): string | null {
  const { date, time } = splitDateTimeLocal(localValue);
  if (!date || !time) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  if ([y, m, d, h, min].some((n) => Number.isNaN(n))) return null;
  const parsed = new Date(y, m - 1, d, h, min);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Parse an ISO timestamp from the client for database storage. */
export function parseScheduledAtIso(value: string): Date | null {
  if (!value || !value.includes("T")) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
