"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CalendarClock,
  Eye,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginGate } from "@/components/features/login-gate";
import { DriverForm } from "@/components/features/driver-form";
import { cn } from "@/lib/utils";
import type {
  CarpoolOrderDTO,
  JoinedTripDTO,
  TripDetailDTO,
  TripStatus,
  SessionUserDTO,
  DriverInfoDTO,
  DriverBookingRequestDTO,
} from "@/lib/types";

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
        {(user) => user.role === "driver" ? <DriverAccountContent user={user} /> : <AccountContent initialUser={user} />}
      </LoginGate>
    </main>
  );
}

function AccountContent({ initialUser }: { initialUser: SessionUserDTO }) {
  const t = useTranslations("account");
  const tTrip = useTranslations("trip");
  const tDetail = useTranslations("tripDetail");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState(initialUser);
  const [nickname, setNickname] = useState(initialUser.nickname);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUser.avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<"success" | "error" | null>(null);
  const [trips, setTrips] = useState<CarpoolOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteFailedId, setDeleteFailedId] = useState<string | null>(null);
  const [joinedTrips, setJoinedTrips] = useState<JoinedTripDTO[]>([]);
  const [joinedLoading, setJoinedLoading] = useState(true);
  const [joinedLoadError, setJoinedLoadError] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelFailedId, setCancelFailedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TripDetailDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);

  function handleAvatarFile(file: File | undefined) {
    setProfileFeedback(null);
    if (!file || file.size > 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileFeedback("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setProfileFeedback("error");
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatarUrl }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated = (await response.json()) as SessionUserDTO;
      setProfile(updated);
      setNickname(updated.nickname);
      setAvatarUrl(updated.avatarUrl);
      setProfileFeedback("success");
      router.refresh();
    } catch {
      setProfileFeedback("error");
    } finally {
      setSavingProfile(false);
    }
  }

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

  const loadJoinedTrips = useCallback(async () => {
    setJoinedLoading(true);
    setJoinedLoadError(false);
    try {
      const response = await fetch("/api/carpool/joined", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setJoinedTrips((await response.json()) as JoinedTripDTO[]);
    } catch {
      setJoinedLoadError(true);
    } finally {
      setJoinedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJoinedTrips();
  }, [loadJoinedTrips]);

  async function handleCancelJoin(participation: JoinedTripDTO) {
    if (!window.confirm(t("confirmCancelJoin"))) return;
    setCancellingId(participation.id);
    setCancelFailedId(null);
    try {
      const response = await fetch(`/api/carpool/${participation.trip.id}/join`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setCancelFailedId(participation.id);
        return;
      }
      setJoinedTrips((current) =>
        current.filter((item) => item.id !== participation.id)
      );
    } catch {
      setCancelFailedId(participation.id);
    } finally {
      setCancellingId(null);
    }
  }

  async function openTripDetail(id: string) {
    setDetail(null);
    setDetailError(false);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/carpool/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDetail((await response.json()) as TripDetailDTO);
    } catch {
      setDetailError(true);
    } finally {
      setDetailLoading(false);
    }
  }

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
      <CustomerDriverRequests />
      <Card className="border-border bg-card/70 backdrop-blur">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              {profile.nickname}
              {profile.isAdmin && (
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
              {profile.email || t("wechatAccount")}
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
          <CardTitle>{t("editProfile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={t("avatar")} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-9 w-9 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-avatar" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Camera className="h-4 w-4" />
                  {t("uploadAvatar")}
                </Label>
                <Input id="profile-avatar" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
                <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-nickname">{t("nickname")}</Label>
              <Input id="profile-nickname" maxLength={40} required value={nickname} onChange={(event) => setNickname(event.target.value)} />
            </div>
            {profileFeedback && <p className={profileFeedback === "success" ? "text-sm text-emerald-500" : "text-sm text-red-400"}>{t(profileFeedback === "success" ? "profileSaved" : "profileSaveFailed")}</p>}
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingProfile ? t("savingProfile") : t("saveProfile")}
            </Button>
          </form>
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
                  className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  {/* Left info column may wrap internally; the controls on the
                      right never drop to their own row. */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
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
                        {t("occupancy", {
                          count: trip.totalSeats - trip.remainingSeats,
                          total: trip.totalSeats,
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" />
                        {t("total", { price: Number(trip.totalPrice) })}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <Badge
                        variant="outline"
                        className={cn("shrink-0", STATUS_STYLES[trip.status])}
                      >
                        {tTrip(`status.${trip.status}`)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void openTripDetail(trip.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t("viewDetails")}
                      </Button>
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

      <Card className="border-border bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>{t("joinedTrips")}</CardTitle>
        </CardHeader>
        <CardContent>
          {joinedLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{tCommon("loading")}</span>
            </div>
          )}
          {!joinedLoading && joinedLoadError && (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <p>{t("joinedLoadError")}</p>
              <Button variant="outline" size="sm" onClick={() => void loadJoinedTrips()}>
                {tCommon("retry")}
              </Button>
            </div>
          )}
          {!joinedLoading && !joinedLoadError && joinedTrips.length === 0 && (
            <p className="py-10 text-center text-muted-foreground">{t("noJoinedTrips")}</p>
          )}
          {!joinedLoading && !joinedLoadError && joinedTrips.length > 0 && (
            <ul className="divide-y divide-border">
              {joinedTrips.map((participation) => {
                const trip = participation.trip;
                const organizerContact =
                  trip.contactType === "phone"
                    ? trip.phoneNumber
                    : trip.wechatId || trip.phoneNumber;
                return (
                  <li key={participation.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                        <span>{trip.departLocation}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{trip.destination}</span>
                      </p>
                      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{dateFormatter.format(new Date(trip.departTime))}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t("joinedPartySize", { count: participation.partySize })}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("organizerInfo", { name: trip.organizer?.nickname || trip.organizerName })}
                        {organizerContact ? ` · ${organizerContact}` : ""}
                        {trip.organizer?.email ? ` · ${trip.organizer.email}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Button variant="outline" size="sm" disabled={cancellingId === participation.id} onClick={() => void handleCancelJoin(participation)}>
                        {cancellingId === participation.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        {cancellingId === participation.id ? t("cancellingJoin") : t("cancelJoin")}
                      </Button>
                      {cancelFailedId === participation.id && <p className="mt-1 text-xs text-red-400">{t("cancelJoinFailed")}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {(detailLoading || detailError || detail) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget && !detailLoading) { setDetail(null); setDetailError(false); } }}>
          <Card className="max-h-[85vh] w-full max-w-xl overflow-y-auto border-border bg-card shadow-2xl">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle>{tDetail("title")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setDetail(null); setDetailError(false); }} aria-label={tDetail("close")}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {detailLoading && <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>}
              {detailError && <p className="py-10 text-center text-red-400">{tDetail("loadError")}</p>}
              {detail && <TripDetailContent detail={detail} dateFormatter={dateFormatter} />}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TripDetailContent({ detail, dateFormatter }: { detail: TripDetailDTO; dateFormatter: Intl.DateTimeFormat }) {
  const t = useTranslations("tripDetail");
  const tTrip = useTranslations("trip");
  return (
    <>
      <div className="space-y-1 rounded-lg border border-border p-4">
        <p className="font-semibold">{detail.departLocation} <ArrowRight className="mx-1 inline h-4 w-4" /> {detail.destination}</p>
        <p className="text-sm text-muted-foreground"><CalendarClock className="mr-1 inline h-4 w-4" />{dateFormatter.format(new Date(detail.departTime))}</p>
      </div>
      <section className="space-y-2">
        <h3 className="font-semibold">{t("organizer")}</h3>
        <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
          <p className="text-foreground">{detail.organizer?.nickname || detail.organizerName}</p>
          {detail.organizer?.email && <p><Mail className="mr-1 inline h-3.5 w-3.5" />{detail.organizer.email}</p>}
          {detail.wechatId && <p><MessageCircle className="mr-1 inline h-3.5 w-3.5" />{tTrip("wechat")}: {detail.wechatId}</p>}
          {detail.phoneNumber && <p><Phone className="mr-1 inline h-3.5 w-3.5" />{tTrip("phone")}: {detail.phoneNumber}</p>}
        </div>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">{t("participants")}</h3>
        {detail.participants.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{t("noParticipants")}</p> : (
          <ul className="space-y-2">{detail.participants.map((participant) => <li key={participant.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{participant.user.nickname}</span><Badge variant="outline">{t("partySize", { count: participant.partySize })}</Badge></div><p className="mt-1 text-muted-foreground">{participant.contactType === "phone" ? <Phone className="mr-1 inline h-3.5 w-3.5" /> : <MessageCircle className="mr-1 inline h-3.5 w-3.5" />}{participant.contactValue}</p><p className="text-xs text-muted-foreground">{participant.user.email ? `${participant.user.email} · ` : ""}{t("joinedAt", { time: dateFormatter.format(new Date(participant.createdAt)) })}</p></li>)}</ul>
        )}
      </section>
    </>
  );
}

function CustomerDriverRequests() {
  const t = useTranslations("driverRequest");
  const locale = useLocale();
  const [items, setItems] = useState<DriverBookingRequestDTO[]>([]);
  useEffect(() => { void fetch("/api/driver-requests", { cache: "no-store" }).then((response) => response.ok ? response.json() : []).then(setItems).catch(() => undefined); }, []);
  if (items.length === 0) return null;
  const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  return <Card className="border-border bg-card/70"><CardHeader><CardTitle>{t("myRequests")}</CardTitle></CardHeader><CardContent><ul className="divide-y divide-border">{items.map((item) => <li key={item.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.departLocation} → {item.destination}</p><p className="mt-1 text-sm text-muted-foreground">{formatter.format(new Date(item.departTime))} · {t("seatsValue", { count: item.totalSeats })}</p><p className="text-sm text-muted-foreground">{t("driverName", { name: item.driver?.driverName || "-" })}</p></div><Badge variant="outline">{t(`status.${item.status}`)}</Badge></div>{item.status === "confirmed" && <p className="mt-2 text-sm text-emerald-500">{t("confirmedPrice", { price: item.finalPrice || "0" })}</p>}{item.status === "confirmed" && item.carpoolOrderId && <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/account">{t("publishedToTrips")}</Link></Button>}</li>)}</ul></CardContent></Card>;
}

function DriverAccountContent({ user }: { user: SessionUserDTO }) {
  const t = useTranslations("driverAccount");
  const tRequest = useTranslations("driverRequest");
  const locale = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<DriverInfoDTO | undefined>();
  const [profileLoading, setProfileLoading] = useState(true);
  const [requests, setRequests] = useState<DriverBookingRequestDTO[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { void Promise.all([fetch("/api/drivers", { cache: "no-store" }), fetch("/api/driver-requests", { cache: "no-store" })]).then(async ([driversResponse, requestsResponse]) => { const drivers = driversResponse.ok ? await driversResponse.json() as DriverInfoDTO[] : []; setProfile(drivers.find((item) => item.userId === user.id)); setRequests(requestsResponse.ok ? await requestsResponse.json() as DriverBookingRequestDTO[] : []); }).finally(() => setProfileLoading(false)); }, [user.id]);
  const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  async function process(item: DriverBookingRequestDTO, action: "confirm" | "reject") {
    setProcessing(item.id);
    try { const response = await fetch(`/api/driver-requests/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, finalPrice: Number(prices[item.id]) }) }); if (!response.ok) return; const updated = await response.json() as DriverBookingRequestDTO; setRequests((current) => current.map((request) => request.id === updated.id ? updated : request)); } finally { setProcessing(null); }
  }

  return <div className="space-y-6"><Card className="border-border bg-card/70"><CardContent className="flex items-center justify-between gap-4 pt-6"><div><p className="font-semibold">{user.nickname}</p><Badge className="mt-2" variant="outline">{t("driverBadge")}</Badge></div><Button variant="outline" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }}><LogOut className="h-4 w-4" />{t("logout")}</Button></CardContent></Card><Card className="border-border bg-card/70"><CardHeader><CardTitle>{t("profile")}</CardTitle></CardHeader><CardContent>{profileLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <DriverForm initialDriver={profile} onSaved={(saved) => setProfile(saved)} />}</CardContent></Card><Card className="border-border bg-card/70"><CardHeader><CardTitle>{t("messages")}</CardTitle></CardHeader><CardContent>{requests.length === 0 ? <p className="py-8 text-center text-muted-foreground">{t("noMessages")}</p> : <ul className="divide-y divide-border">{requests.map((item) => <li key={item.id} className="space-y-3 py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.customer?.nickname || t("customer")} · {item.departLocation} → {item.destination}</p><p className="mt-1 text-sm text-muted-foreground">{formatter.format(new Date(item.departTime))} · {tRequest("seatsValue", { count: item.totalSeats })} · ¥{item.estimatedPrice}</p><p className="mt-1 text-sm"><MessageCircle className="mr-1 inline h-4 w-4" />{item.customerContactValue}</p>{item.remark && <p className="mt-1 text-sm text-muted-foreground">{item.remark}</p>}</div><Badge variant="outline">{tRequest(`status.${item.status}`)}</Badge></div>{item.status === "pending" && <div className="flex flex-col gap-2 sm:flex-row"><Input type="number" min="0" step="0.01" placeholder={t("finalPrice")} value={prices[item.id] || ""} onChange={(event) => setPrices({ ...prices, [item.id]: event.target.value })} /><Button disabled={processing === item.id || !prices[item.id]} onClick={() => void process(item, "confirm")}>{t("confirm")}</Button><Button variant="destructive" disabled={processing === item.id} onClick={() => void process(item, "reject")}>{t("reject")}</Button></div>}{item.status === "confirmed" && <p className="text-sm text-emerald-500">{tRequest("confirmedPrice", { price: item.finalPrice || "0" })}</p>}</li>)}</ul>}</CardContent></Card></div>;
}
