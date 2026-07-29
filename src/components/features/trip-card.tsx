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
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  CarpoolOrderDTO,
  TripJoinPayload,
  TripStatus,
} from "@/lib/types";

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
  const [joinOpen, setJoinOpen] = useState(false);
  const [partySize, setPartySize] = useState("1");
  const [contactType, setContactType] = useState<"wechat" | "phone">(
    "wechat"
  );
  const [contactValue, setContactValue] = useState("");
  const [feedback, setFeedback] = useState<
    | "success"
    | "error"
    | "needLogin"
    | "alreadyJoined"
    | "ownTrip"
    | "insufficientSeats"
    | null
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

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoining(true);
    setFeedback(null);
    try {
      const payload: TripJoinPayload = {
        partySize: Number(partySize),
        contactType,
        contactValue: contactValue.trim(),
      };
      const response = await fetch(`/api/carpool/${trip.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        setFeedback("needLogin");
        return;
      }
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setFeedback(
          data.error === "already_joined"
            ? "alreadyJoined"
            : data.error === "own_trip"
              ? "ownTrip"
              : data.error === "insufficient_seats"
                ? "insufficientSeats"
                : "error"
        );
        return;
      }
      const data = (await response.json()) as { trip: CarpoolOrderDTO };
      onJoined(data.trip);
      setJoinOpen(false);
      setFeedback("success");
    } catch {
      setFeedback("error");
    } finally {
      setJoining(false);
    }
  }

  return (
    <>
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
            onClick={() => {
              setFeedback(null);
              setJoinOpen(true);
            }}
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
          {feedback === "alreadyJoined" && (
            <p className="text-center text-xs text-amber-500">
              {t("alreadyJoined")}
            </p>
          )}
          {feedback === "ownTrip" && (
            <p className="text-center text-xs text-amber-500">
              {t("ownTrip")}
            </p>
          )}
          {feedback === "insufficientSeats" && (
            <p className="text-center text-xs text-red-400">
              {t("insufficientSeats")}
            </p>
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

      {joinOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`join-title-${trip.id}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !joining) {
              setJoinOpen(false);
            }
          }}
        >
          <form
            onSubmit={handleJoin}
            className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={`join-title-${trip.id}`}
                  className="text-lg font-semibold text-foreground"
                >
                  {t("joinDialog.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("joinDialog.subtitle")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={joining}
                onClick={() => setJoinOpen(false)}
                aria-label={t("joinDialog.close")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`party-size-${trip.id}`}>
                {t("joinDialog.partySize")}
              </Label>
              <Input
                id={`party-size-${trip.id}`}
                type="number"
                min="1"
                max={trip.remainingSeats}
                required
                value={partySize}
                onChange={(event) => setPartySize(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("joinDialog.available", { count: trip.remainingSeats })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>{t("joinDialog.contactType")}</Label>
              <Select
                value={contactType}
                onValueChange={(value) =>
                  setContactType(value as "wechat" | "phone")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wechat">{t("wechat")}</SelectItem>
                  <SelectItem value="phone">{t("phone")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`join-contact-${trip.id}`}>
                {t("joinDialog.contactValue")}
              </Label>
              <Input
                id={`join-contact-${trip.id}`}
                required
                value={contactValue}
                placeholder={t(
                  contactType === "phone"
                    ? "joinDialog.phonePlaceholder"
                    : "joinDialog.wechatPlaceholder"
                )}
                onChange={(event) => setContactValue(event.target.value)}
              />
            </div>

            {feedback === "needLogin" && (
              <p className="text-sm text-amber-500">
                {t("needLogin")} {" "}
                <Link href="/login" className="underline underline-offset-4">
                  {t("goLogin")}
                </Link>
              </p>
            )}

            {feedback && feedback !== "needLogin" && (
              <p className="text-sm text-red-400">
                {t(
                  feedback === "alreadyJoined"
                    ? "alreadyJoined"
                    : feedback === "ownTrip"
                      ? "ownTrip"
                      : feedback === "insufficientSeats"
                        ? "insufficientSeats"
                        : "joinFailed"
                )}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={joining}
                onClick={() => setJoinOpen(false)}
              >
                {t("joinDialog.cancel")}
              </Button>
              <Button type="submit" disabled={joining}>
                {joining ? t("joining") : t("joinDialog.confirm")}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
