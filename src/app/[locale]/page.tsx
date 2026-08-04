"use client";

import { motion } from "framer-motion";
import { List, PlusCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TripBoard } from "@/components/features/trip-board";
import { VipAdCarousel } from "@/components/features/vip-ad-carousel";

// Homepage: hero + filterable grid of all published carpool trips.
export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-36 pt-16 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-foreground/80 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          {t("badge")}
        </span>
        <h1 className="mt-5 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-4xl font-bold text-transparent sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 text-center text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
        <VipAdCarousel />
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/publish">
              <PlusCircle className="h-4 w-4" />
              {t("publishCta")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/carpool-list">
              <List className="h-4 w-4" />
              {t("browseCta")}
            </Link>
          </Button>
        </div>
      </motion.section>

      <h2 className="mb-5 text-xl font-semibold text-foreground">
        {t("latestTrips")}
      </h2>
      <TripBoard />
    </main>
  );
}
