"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DriverInfoDTO } from "@/lib/types";

export function DriverRequestDialog({ driver, onClose }: { driver: DriverInfoDTO; onClose: () => void }) {
  const t = useTranslations("driverRequest");
  const [form, setForm] = useState({ departLocation: "", destination: "", departTime: "", totalSeats: "1", estimatedPrice: "", customerContactType: "wechat", customerContactValue: "", remark: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<{ phone: string; wechat: string | null } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const response = await fetch("/api/driver-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, driverId: driver.id, totalSeats: Number(form.totalSeats), estimatedPrice: Number(form.estimatedPrice) }) });
      const data = (await response.json()) as { error?: string; driverContact?: { phone: string; wechat: string | null } };
      if (!response.ok || !data.driverContact) { setError(data.error || "create_failed"); return; }
      setContact(data.driverContact);
    } catch { setError("create_failed"); } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true"><Card className="max-h-[92vh] w-full max-w-xl overflow-y-auto"><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>{contact ? t("contactUnlocked") : t("title", { driver: driver.driverName })}</CardTitle><Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button></CardHeader><CardContent>{contact ? <div className="space-y-4"><p className="text-sm text-muted-foreground">{t("submitted")}</p><div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">{contact.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{contact.phone}</p>}{contact.wechat && <p className="mt-2 flex items-center gap-2"><MessageCircle className="h-4 w-4" />{contact.wechat}</p>}</div><Button className="w-full" onClick={onClose}>{t("done")}</Button></div> : <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label={t("depart")}><Input required value={form.departLocation} onChange={(e) => setForm({ ...form, departLocation: e.target.value })} /></Field><Field label={t("destination")}><Input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field><Field label={t("departTime")}><Input required type="datetime-local" value={form.departTime} onChange={(e) => setForm({ ...form, departTime: e.target.value })} /></Field><Field label={t("seats")}><Input required type="number" min="1" max="20" value={form.totalSeats} onChange={(e) => setForm({ ...form, totalSeats: e.target.value })} /></Field><Field label={t("estimatedPrice")}><Input required type="number" min="0" step="0.01" value={form.estimatedPrice} onChange={(e) => setForm({ ...form, estimatedPrice: e.target.value })} /></Field><Field label={t("contactType")}><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.customerContactType} onChange={(e) => setForm({ ...form, customerContactType: e.target.value })}><option value="wechat">{t("wechat")}</option><option value="phone">{t("phone")}</option></select></Field></div><Field label={t("contactValue")}><Input required value={form.customerContactValue} onChange={(e) => setForm({ ...form, customerContactValue: e.target.value })} /></Field><Field label={t("remark")}><Textarea rows={3} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} /></Field>{error && <p className="text-sm text-red-400">{t(error === "driver_not_online" ? "driverOffline" : "failed")}</p>}<Button className="w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{t("submit")}</Button></form>}</CardContent></Card></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
