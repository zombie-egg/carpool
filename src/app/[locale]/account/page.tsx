"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginGate } from "@/components/features/login-gate";
import { cn } from "@/lib/utils";
import type { CarpoolOrderDTO, TripStatus } from "@/lib/types";

const STATUS_STYLES: Record<TripStatus, string> = {
  recruiting: "border-emerald-500/40 bg-emerald-500/15 text-emerald-500",
  full: "border-amber-500/40 bg-amber-500/15 text-amber-500",
  finished: "border-border bg-muted text-muted-foreground",
};

// Personal center: account info, my published trips and logout.
export default function AccountPage() {
  const t = useTranslations("account");

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
        {(user) => <AccountContent userNickname={user.nickname} userEmail={user.email} isAdmin={user.isAdmin} />}
      </LoginGate>
    </main>
  );
}

interface AccountContentProps {
  userNickname: string;
  userEmail: string;
  isAdmin: boolean;
}

function AccountContent({ userNickname, userEmail, isAdmin }: AccountContentProps) {
  const t = useTranslations("account");
  const tTrip = useTranslations("trip");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [trips, setTrips] = useState<CarpoolOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteFailedId, setDeleteFailedId] = useState<string | null>(null);

  const loadMyTrips = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/api/carpool?mine=1", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as CarpoolOrderDTO[];
      setTrips(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyTrips();
  }, [loadMyTrips]);

  async function handleDeleteTrip(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    setDeleteFailedId(null);
    try {
      const response = await fetch(`/api/carpool/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setDeleteFailedId(id);
        return;
      }
      setTrips((current) => current.filter((trip) => trip.id !== id));
    } catch {
      setDeleteFailedId(id);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : "en-US",
    { dateStyle: "medium", timeStyle: "short" }
  );

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/70 backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              {userNickname}
              {isAdmin && (
                <Badge
                  variant="outline"
                  className="border-purple-500/40 bg-purple-500/15 text-purple-400"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {t("adminBadge")}
                </Badge>
              )}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {userEmail}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {loggingOut ? t("loggingOut") : t("logout")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>{t("myTrips")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{tCommon("loading")}</span>
            </div>
          )}
          {!loading && loadError && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <p>{t("loadError")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadMyTrips()}
              >
                {tCommon("retry")}
              </Button>
            </div>
          )}
          {!loading && !loadError && trips.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <p>{t("noTrips")}</p>
              <Button asChild size="sm">
                <Link href="/publish">{t("publishNow")}</Link>
              </Button>
            </div>
          )}
          {!loading && !loadError && trips.length > 0 && (
            <ul className="divide-y divide-border">
              {trips.map((trip) => (
                <li
                  key={trip.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>{trip.departLocation}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{trip.destination}</span>
                    </p>
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {dateFormatter.format(new Date(trip.departTime))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {t("seats", {
                          count: trip.remainingSeats,
                          total: trip.totalSeats,
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" />
                        {t("total", { price: Number(trip.totalPrice) })}
                      </span>
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("shrink-0", STATUS_STYLES[trip.status])}
                      >
                        {tTrip(`status.${trip.status}`)}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === trip.id}
                        onClick={() => void handleDeleteTrip(trip.id)}
                      >
                        {deletingId === trip.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {t("delete")}
                      </Button>
                    </div>
                    {deleteFailedId === trip.id && (
                      <p className="text-xs text-red-400">
                        {t("deleteFailed")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
