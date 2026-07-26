"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { THEME_STORAGE_KEY } from "@/lib/theme";

// Re-applies the saved theme after every navigation. Locale switches re-render
// the <html> element and would otherwise reset its class to the server default,
// flipping the user's chosen light/dark mode.
export function ThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    document.documentElement.classList.toggle("dark", stored !== "light");
  }, [pathname]);

  return null;
}
