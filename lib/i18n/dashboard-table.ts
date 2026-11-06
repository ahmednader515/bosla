"use client";

import { useLocale } from "@/components/LocaleProvider";
import { getDir } from "@/lib/i18n/core";

/** Table + header alignment: English → logical start (left), Arabic → logical start (right). */
export function useDashboardTable() {
  const locale = useLocale();
  const dir = getDir(locale);
  const thClass =
    "px-3 py-2 text-start text-sm font-semibold text-[var(--color-foreground)]";
  const thClassCompact =
    "p-2 text-start text-sm font-medium text-[var(--color-foreground)]";
  return { locale, dir, thClass, thClassCompact };
}

export { dateLocaleForUi, userCreatedAtToIso, formatAccountCreatedAt } from "@/lib/i18n/account-dates";
