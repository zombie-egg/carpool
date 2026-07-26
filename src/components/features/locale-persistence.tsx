"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isAppLocale } from "@/i18n/routing";
import { LOCALE_STORAGE_KEY } from "@/lib/constants";

// Restores the language saved in localStorage after a refresh or direct visit.
// Renders nothing; mounted once in the locale layout.
export function LocalePersistence() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      return;
    }
    if (stored !== locale && isAppLocale(stored)) {
      router.replace(pathname, { locale: stored });
    }
  }, [locale, pathname, router]);

  return null;
}
