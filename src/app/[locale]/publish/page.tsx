"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LoginGate } from "@/components/features/login-gate";
import { PublishForm } from "@/components/features/publish-form";

// Publish page: organizers create new carpool trips here (login required).
export default function PublishPage() {
  const t = useTranslations("publish");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-36 pt-16 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </motion.header>
      <LoginGate message={t("needLogin")}>
        {(user) => <PublishForm defaultOrganizer={user.nickname} />}
      </LoginGate>
    </main>
  );
}
