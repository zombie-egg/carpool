"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarRange,
  Clock,
  MessageCircle,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DriverForm } from "@/components/features/driver-form";
import type { DriverInfoDTO } from "@/lib/types";

interface DriverListProps {
  drivers: DriverInfoDTO[];
  onUpdated: (driver: DriverInfoDTO) => void;
  onDeleted: (id: string) => void;
}

// Driver cards with inline edit and delete actions.
export function DriverList({ drivers, onUpdated, onDeleted }: DriverListProps) {
  const t = useTranslations("driver");
  const locale = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : "en-US",
    { dateStyle: "medium" }
  );

  async function handleDelete(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    setFailedId(null);
    try {
      const response = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setFailedId(id);
        return;
      }
      onDeleted(id);
    } catch {
      setFailedId(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (drivers.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {drivers.map((driver) =>
        editingId === driver.id ? (
          <div key={driver.id} className="lg:col-span-2">
            <DriverForm
              initialDriver={driver}
              onSaved={(updated) => {
                onUpdated(updated);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        ) : (
          <motion.div
            key={driver.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="h-full border-border bg-card/70 backdrop-blur">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-foreground">
                    {driver.driverName}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {driver.licensePlate}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-sky-500/40 bg-sky-500/15 text-sky-400"
                >
                  {t(`carTypes.${driver.carType}`)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm text-foreground/80">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {driver.phone}
                  </span>
                  {driver.wechat && (
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      {driver.wechat}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("serviceDates")}:{" "}
                    {dateFormatter.format(new Date(driver.operationStartDate))}{" "}
                    – {dateFormatter.format(new Date(driver.operationEndDate))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("dailyWindow")}: {driver.dailyAvailableStart} –{" "}
                    {driver.dailyAvailableEnd}
                  </span>
                </div>
                {driver.carRemark && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{driver.carRemark}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingId(driver.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t("actions.edit")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={deletingId === driver.id}
                    onClick={() => void handleDelete(driver.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("actions.delete")}
                  </Button>
                </div>
                {failedId === driver.id && (
                  <p className="text-center text-xs text-red-400">{t("fail")}</p>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )
      )}
    </div>
  );
}
