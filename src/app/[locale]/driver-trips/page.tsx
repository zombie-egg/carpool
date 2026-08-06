"use client";

import { useTranslations } from "next-intl";
import { TripBoard } from "@/components/features/trip-board";

export default function DriverTripsPage() {
  const t = useTranslations("driverAccount");
  return <main className="mx-auto w-full max-w-7xl px-4 pb-36 pt-16 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold">{t("myTrips")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("myTripsSubtitle")}</p><div className="mt-8"><TripBoard /></div></main>;
}
