"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { VipAdvertisementDTO } from "@/lib/types";

export function VipAdCarousel() {
  const t = useTranslations("hotspots");
  const [items, setItems] = useState<VipAdvertisementDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/promotions/vip", { cache: "no-store" });
      if (response.ok) setItems((await response.json()) as VipAdvertisementDTO[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);
  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      5000
    );
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!loading && items.length === 0) return null;
  const active = items[index];

  return (
    <div className="relative mx-auto mt-6 h-16 w-full overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-card/85 to-purple-500/10 px-4 shadow-sm backdrop-blur sm:h-[4.5rem] sm:px-6">
      {loading ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            className="flex h-full min-w-0 items-center gap-3 text-left"
          >
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/20 px-2 py-1 text-[10px] font-bold not-italic text-amber-500 sm:text-xs">
              <Crown className="h-3.5 w-3.5" /> VIP
            </span>
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
              <p className="truncate text-sm font-semibold text-foreground sm:max-w-64 sm:text-base">
                {active.title}
              </p>
              <p className="truncate text-xs text-muted-foreground sm:flex-1 sm:text-sm">
                {active.content}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {t("vipCounter", { current: index + 1, total: items.length })}
            </span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
