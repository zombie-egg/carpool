"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  MessageCircle,
  Phone,
  StickyNote,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CarpoolOrderDTO, TripStatus } from "@/lib/types";

const STATUS_STYLES: Record<TripStatus, string> = {
  recruiting: "border-emerald-500/40 bg-emerald-500/15 text-emerald-500",
  full: "border-amber-500/40 bg-amber-500/15 text-amber-500",
  finished: "border-border bg-muted text-muted-foreground",
};

interface TripCardProps {
  trip: CarpoolOrderDTO;
  onJoined: (updated: CarpoolOrderDTO) => void;
}

// One carpool trip card: route, time, seats, total price and a join action.
export function TripCard({ trip, onJoined }: TripCardProps) {
  const t = useTranslations("trip");
  const locale = useLocale();
  const [joining, setJoining] = useState(false);
  const [feedback, setFeedback] = useState<
    "success" | "error" | "needLogin" | null
  >(null);

  const departFormatted = new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : "en-US",
    { dateStyle: "medium", timeStyle: "short" }
  ).format(new Date(trip.departTime));

  const totalPrice = Number(trip.totalPrice);
  // Reference figure only: the real share depends on the final headcount.
  const perSeatWhenFull =
    trip.totalSeats > 0
      ? Math.round((totalPrice / trip.totalSeats) * 100) / 100
      : totalPrice;

  const canJoin = trip.status === "recruiting" && trip.remainingSeats > 0;
  const riderCount = trip.totalSeats - trip.remainingSeats;
  const showWechat = trip.contactType !== "phone" && trip.wechatId;
  const showPhone = trip.contactType !== "wechat" && trip.phoneNumber;

  async function handleJoin() {
    setJoining(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/carpool/${trip.id}/join`, {
        method: "POST",
      });
      if (response.status === 401) {
        setFeedback("needLogin");
        return;
      }
      if (!response.ok) {
        setFeedback("error");
        return;
      }
      const updated = (await response.json()) as CarpoolOrderDTO;
      onJoined(updated);
      setFeedback("success");
    } catch {
      setFeedback("error");
    } finally {
      setJoining(false);
    }
  }

  return (
    <motion.div
      className="h-full"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="flex h-full flex-col border-border bg-card/70 backdrop-blur">
        <CardHeader className="min-h-[4.25rem] flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {trip.organizerName}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0", STATUS_STYLES[trip.status])}
          >
            {t(`status.${trip.status}`)}
          </Badge>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 text-sm">
          <div className="flex h-12 items-start gap-2 overflow-hidden text-base font-semibold text-foreground">
            <span className="line-clamp-2">{trip.departLocation}</span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="line-clamp-2">{trip.destination}</span>
          </div>
          <div className="flex h-10 items-start gap-2 overflow-hidden text-foreground/80">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="line-clamp-2">
              {t("departAt")}: {departFormatted}
            </span>
          </div>
          <div className="flex h-6 items-center gap-2 text-foreground/80">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              {t("occupancy", {
                count: riderCount,
                total: trip.totalSeats,
              })}
            </span>
          </div>
          <div className="flex h-10 flex-wrap content-start items-center gap-x-3 gap-y-1 overflow-hidden">
            <span className="inline-flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-semibold text-emerald-500">
                {t("totalPrice", { price: totalPrice })}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {t("perSeatEstimate", { price: perSeatWhenFull })}
            </span>
          </div>
          <div className="flex h-10 flex-wrap content-start items-center gap-x-4 gap-y-1 overflow-hidden text-foreground/80">
            {showWechat && (
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                {t("wechat")}: {trip.wechatId}
              </span>
            )}
            {showPhone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {t("phone")}: {trip.phoneNumber}
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 items-start gap-2 overflow-hidden text-muted-foreground",
              !trip.remark && "invisible"
            )}
            aria-hidden={!trip.remark}
          >
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{trip.remark || "placeholder"}</span>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <Button
            onClick={handleJoin}
            disabled={!canJoin || joining}
            className="w-full"
          >
            {joining ? t("joining") : t("join")}
          </Button>
          {feedback === "success" && (
            <p className="text-center text-xs text-emerald-500">
              {t("joinSuccess")}
            </p>
          )}
          {feedback === "error" && (
            <p className="text-center text-xs text-red-400">{t("joinFailed")}</p>
          )}
          {feedback === "needLogin" && (
            <p className="text-center text-xs text-amber-500">
              {t("needLogin")}{" "}
              <Link href="/login" className="underline underline-offset-4">
                {t("goLogin")}
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
