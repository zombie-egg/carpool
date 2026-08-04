"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
      if (response.ok) {
        const advertisements = (await response.json()) as VipAdvertisementDTO[];
        const imageAdvertisements = advertisements.filter((item) => Boolean(item.imageData));
        await Promise.all(
          imageAdvertisements.map(
            (item) =>
              new Promise<void>((resolve) => {
                const image = new Image();
                image.onload = () => resolve();
                image.onerror = () => resolve();
                image.src = item.imageData || "";
              })
          )
        );
        setItems(imageAdvertisements);
      }
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
    <div className="relative mx-auto mt-6 aspect-[5/2] w-full max-w-3xl overflow-hidden rounded-xl border border-amber-400/30 bg-black shadow-sm">
      {loading ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            key={active.id}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 1 }}
            transition={{ duration: 0.65, ease: [0.45, 0, 0.55, 1] }}
            className="absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.imageData || ""} alt={t("vipImageAlt")} className="h-full w-full object-contain" />
            <span className="absolute bottom-1.5 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white">
              {t("vipCounter", { current: index + 1, total: items.length })}
            </span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
