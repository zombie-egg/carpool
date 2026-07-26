import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { isAppLocale, routing } from "@/i18n/routing";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { DockNav } from "@/components/features/dock-nav";
import { LocalePersistence } from "@/components/features/locale-persistence";
import { ThemeSync } from "@/components/features/theme-sync";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isAppLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        {/* Applies the saved light/dark theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Global italic typography per design requirement. */}
      <body className="min-h-screen bg-background font-sans italic text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          {/* Fixed animated backdrop; content renders above it via z-10. */}
          <div className="fixed inset-0 z-0">
            <BackgroundBeams />
          </div>
          <div className="relative z-10">{children}</div>
          <DockNav />
          <LocalePersistence />
          <ThemeSync />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
