import type { Locale } from "@/lib/i18n/types";

export function dateLocaleForUi(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en-GB";
}

export function userCreatedAtToIso(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatAccountCreatedAt(
  iso: string | null | undefined,
  locale: Locale,
  empty = "—",
): string {
  if (!iso) return empty;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return empty;
  return d.toLocaleString(dateLocaleForUi(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
