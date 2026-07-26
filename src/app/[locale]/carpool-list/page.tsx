"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { TripBoard } from "@/components/features/trip-board";

// Full trip listing page with the same filterable board as the homepage.
export default function CarpoolListPage() {
  const t = useTranslations("list");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-36 pt-16 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </motion.header>
      <TripBoard />
    </main>
  );
}
