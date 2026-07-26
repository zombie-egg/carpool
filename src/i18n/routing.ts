import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Supported UI languages of the carpool site.
  locales: ["zh", "en"],
  // Chinese is the default for a Chinese campus audience.
  defaultLocale: "zh",
  // Always prefix routes with the locale: /zh/... and /en/...
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}
