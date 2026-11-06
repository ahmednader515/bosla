"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/** إعادة التحقق من الجلسة دورياً لاكتشاف تسجيل الدخول من جهاز آخر — ٣٠ث توازن بين الاستجابة وحمل الشبكة */
const SESSION_REFETCH_INTERVAL = 30;

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={SESSION_REFETCH_INTERVAL}>
      {children}
    </NextAuthSessionProvider>
  );
}
