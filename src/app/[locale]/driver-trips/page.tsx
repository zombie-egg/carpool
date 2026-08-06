"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DriverBookingRequestDTO } from "@/lib/types";

export default function DriverTripsPage() {
  const t = useTranslations("driverAccount");
  const tr = useTranslations("driverRequest");
  const locale = useLocale();
  const [items, setItems] = useState<DriverBookingRequestDTO[]>([]);
  const [tab, setTab] = useState<"ready" | "pending" | "completed">("ready");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const load = () => void fetch("/api/driver-requests", { cache: "no-store" }).then((response) => response.ok ? response.json() : []).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); const timer = window.setInterval(load, 60_000); return () => window.clearInterval(timer); }, []);
  const groups = useMemo(() => ({ ready: items.filter((item) => item.status === "confirmed" && new Date(item.departTime) >= new Date()), pending: items.filter((item) => item.status === "pending"), completed: items.filter((item) => item.status === "rejected" || (item.status === "confirmed" && new Date(item.departTime) < new Date())) }), [items]);
  async function process(item: DriverBookingRequestDTO, action: "confirm" | "reject") { setProcessing(item.id); try { const response = await fetch(`/api/driver-requests/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, finalPrice: Number(prices[item.id]) }) }); if (response.ok) load(); } finally { setProcessing(null); } }
  const formatter = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  return <main className="mx-auto w-full max-w-5xl px-4 pb-36 pt-16 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold">{t("myTrips")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("myTripsSubtitle")}</p><div className="mt-8 grid grid-cols-3 gap-2"><Button variant={tab === "ready" ? "default" : "outline"} onClick={() => setTab("ready")}>{t("readyOrders")} ({groups.ready.length})</Button><Button variant={tab === "pending" ? "default" : "outline"} onClick={() => setTab("pending")}>{t("pendingOrders")} ({groups.pending.length})</Button><Button variant={tab === "completed" ? "default" : "outline"} onClick={() => setTab("completed")}>{t("completedOrders")} ({groups.completed.length})</Button></div>{loading ? <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div> : <div className="mt-5 space-y-4">{groups[tab].length === 0 && <p className="py-12 text-center text-muted-foreground">{t("noOrders")}</p>}{groups[tab].map((item) => <Card key={item.id} className="border-border bg-card/70"><CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle className="text-lg">{item.departLocation} → {item.destination}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{formatter.format(new Date(item.departTime))} · {tr("seatsValue", { count: item.totalSeats })}</p></div><Badge variant="outline">{tr(`status.${item.status}`)}</Badge></CardHeader><CardContent><p className="text-sm">{t("customer")}: {item.customer?.nickname || "-"} · {item.customerContactValue}</p><p className="mt-1 text-sm text-muted-foreground">{t("estimatedPrice")}: ¥{item.estimatedPrice}{item.finalPrice ? ` · ${t("finalPriceValue", { price: item.finalPrice })}` : ""}</p>{item.status === "pending" && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input type="number" min="0" step="0.01" placeholder={t("finalPrice")} value={prices[item.id] || ""} onChange={(event) => setPrices({ ...prices, [item.id]: event.target.value })} /><Button disabled={processing === item.id || !prices[item.id]} onClick={() => void process(item, "confirm")}>{t("confirm")}</Button><Button variant="destructive" disabled={processing === item.id} onClick={() => void process(item, "reject")}>{t("reject")}</Button></div>}</CardContent></Card>)}</div>}</main>;
}
