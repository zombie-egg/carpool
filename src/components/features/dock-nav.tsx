"use client";

import { useEffect, useState } from "react";
import {
  Car,
  Flame,
  Home,
  Languages,
  List,
  LogIn,
  Moon,
  PlusCircle,
  Sun,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { LOCALE_STORAGE_KEY } from "@/lib/constants";
import { applyTheme, THEME_STORAGE_KEY, type AppTheme } from "@/lib/theme";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { useSession } from "@/components/features/use-session";

interface NavEntry {
  key: "home" | "publish" | "list" | "hotspots" | "driver";
  href: string;
  Icon: typeof Home;
}

const NAV_ENTRIES: NavEntry[] = [
  { key: "home", href: "/", Icon: Home },
  { key: "publish", href: "/publish", Icon: PlusCircle },
  { key: "list", href: "/carpool-list", Icon: List },
  { key: "hotspots", href: "/hotspots", Icon: Flame },
  { key: "driver", href: "/driver", Icon: Car },
];

// Bottom-center Apple-style dock: navigation, account, theme and language.
export function DockNav() {
  const t = useTranslations("nav");
  const tTheme = useTranslations("theme");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSession();
  const [theme, setTheme] = useState<AppTheme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  const toggleLocale = () => {
    const nextLocale: AppLocale = locale === "zh" ? "en" : "zh";
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    router.replace(pathname, { locale: nextLocale });
  };

  const toggleTheme = () => {
    const next: AppTheme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const iconClass = "h-full w-full text-foreground/80";
  const driverMode = user?.role === "driver";
  const entries = driverMode ? NAV_ENTRIES.filter((entry) => entry.key === "driver") : NAV_ENTRIES;
  const navLabel = (key: NavEntry["key"]) => t(key === "driver" ? (driverMode ? "driverProfile" : !user?.isAdmin ? "driverInfo" : "driver") : key);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
      <div className="pointer-events-auto">
        <Dock
          className="items-end gap-1 px-2 sm:gap-4 sm:px-4"
          magnification={40}
        >
          {entries.map(({ key, href, Icon }) => (
            <Link
              key={key}
              href={href}
              aria-label={navLabel(key)}
            >
              <DockItem>
                <DockLabel>
                  {navLabel(key)}
                </DockLabel>
                <DockIcon>
                  <Icon className={iconClass} />
                </DockIcon>
              </DockItem>
            </Link>
          ))}
          <button type="button" onClick={toggleTheme} aria-label={t("theme")}>
            <DockItem>
              <DockLabel>
                {theme === "dark" ? tTheme("light") : tTheme("dark")}
              </DockLabel>
              <DockIcon>
                {theme === "dark" ? (
                  <Sun className={iconClass} />
                ) : (
                  <Moon className={iconClass} />
                )}
              </DockIcon>
            </DockItem>
          </button>
          {!driverMode && <button type="button" onClick={toggleLocale} aria-label={t("language")}>
            <DockItem>
              <DockLabel>{t("language")}</DockLabel>
              <DockIcon>
                <Languages className={iconClass} />
              </DockIcon>
            </DockItem>
          </button>}
          {/* Personal center lives at the far right of the dock. */}
          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? t("account") : t("login")}
          >
            <DockItem>
              <DockLabel>
                {user
                  ? `${t("account")} · ${user.nickname}`
                  : t("login")}
              </DockLabel>
              <DockIcon>
                {user ? (
                  user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <UserRound className="h-full w-full text-emerald-400" />
                  )
                ) : (
                  <LogIn className={iconClass} />
                )}
              </DockIcon>
            </DockItem>
          </Link>
        </Dock>
      </div>
    </nav>
  );
}
