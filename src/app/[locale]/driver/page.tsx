"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriverForm } from "@/components/features/driver-form";
import { DriverList } from "@/components/features/driver-list";
import { LoginGate } from "@/components/features/login-gate";
import type { DriverInfoDTO } from "@/lib/types";

// Driver Management Center: add drivers and view/edit/delete existing records.
export default function DriverPage() {
  const t = useTranslations("driver");
  const tCommon = useTranslations("common");
  const [drivers, setDrivers] = useState<DriverInfoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/drivers", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as DriverInfoDTO[];
      setDrivers(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4000);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-36 pt-16 sm:px-6 lg:px-8">
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

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      <LoginGate message={t("needLogin")}>
        {(user) =>
          !user.isAdmin ? (
            <div className="rounded-xl border border-border bg-card/70 px-6 py-16 text-center text-muted-foreground backdrop-blur">
              {t("adminOnly")}
            </div>
          ) : (
      <Tabs defaultValue="add">
        <TabsList className="bg-card/80">
          <TabsTrigger value="add">{t("tabs.add")}</TabsTrigger>
          <TabsTrigger value="list">{t("tabs.list")}</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-5">
          <DriverForm
            onSaved={(driver) => {
              setDrivers((current) => [driver, ...current]);
              showNotice(t("addSuccess"));
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{tCommon("loading")}</span>
            </div>
          )}
          {!loading && loadError && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <p>{t("loadError")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadDrivers()}
              >
                {tCommon("retry")}
              </Button>
            </div>
          )}
          {!loading && !loadError && (
            <DriverList
              drivers={drivers}
              onUpdated={(updated) => {
                setDrivers((current) =>
                  current.map((driver) =>
                    driver.id === updated.id ? updated : driver
                  )
                );
                showNotice(t("updateSuccess"));
              }}
              onDeleted={(id) => {
                setDrivers((current) =>
                  current.filter((driver) => driver.id !== id)
                );
                showNotice(t("deleteSuccess"));
              }}
            />
          )}
        </TabsContent>
      </Tabs>
          )
        }
      </LoginGate>
    </main>
  );
}
