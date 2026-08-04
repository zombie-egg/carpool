"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { Flame, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/components/features/use-session";
import { compressImageFile } from "@/lib/image-file";
import type { MerchantPromotionDTO, VipAdvertisementDTO } from "@/lib/types";

export default function HotspotsPage() {
  const t = useTranslations("hotspots");
  const common = useTranslations("common");
  const { user, loading: sessionLoading } = useSession();
  const isAdmin = user?.isAdmin === true;
  const [merchants, setMerchants] = useState<MerchantPromotionDTO[]>([]);
  const [vipItems, setVipItems] = useState<VipAdvertisementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedPoster, setExpandedPoster] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [merchantResponse, vipResponse] = await Promise.all([
        fetch("/api/promotions/merchants", { cache: "no-store" }),
        fetch("/api/promotions/vip", { cache: "no-store" }),
      ]);
      if (!merchantResponse.ok || !vipResponse.ok) throw new Error("load_failed");
      setMerchants((await merchantResponse.json()) as MerchantPromotionDTO[]);
      setVipItems((await vipResponse.json()) as VipAdvertisementDTO[]);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void loadAll(), [loadAll]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-36 pt-16 sm:px-6 lg:px-8">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold sm:text-4xl">
          <Flame className="h-8 w-8 text-orange-500" /> {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("subtitle")}</p>
      </motion.header>

      {!sessionLoading && isAdmin && (
        <Tabs defaultValue="merchant" className="mb-8">
          <TabsList className="bg-card/80">
            <TabsTrigger value="merchant">{t("merchantAdmin")}</TabsTrigger>
            <TabsTrigger value="vip">{t("vipAdmin")}</TabsTrigger>
          </TabsList>
          <TabsContent value="merchant" className="mt-5">
            <MerchantForm onCreated={(item) => setMerchants((current) => [item, ...current])} />
          </TabsContent>
          <TabsContent value="vip" className="mt-5">
            <VipForm onCreated={(item) => setVipItems((current) => [item, ...current])} />
          </TabsContent>
        </Tabs>
      )}

      {loading && <div className="flex justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{common("loading")}</div>}
      {!loading && loadError && <div className="py-16 text-center"><p className="text-muted-foreground">{t("loadError")}</p><Button className="mt-3" variant="outline" onClick={() => void loadAll()}>{common("retry")}</Button></div>}
      {!loading && !loadError && merchants.length === 0 && <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>}
      {!loading && !loadError && merchants.length > 0 && (
        <div className="space-y-6">
          {merchants.map((merchant) => {
            const posters = [merchant.poster1, merchant.poster2, merchant.poster3].filter(Boolean) as string[];
            return (
              <Card key={merchant.id} className="border-border bg-card/75 backdrop-blur">
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div><CardTitle>{merchant.merchantName}</CardTitle><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{merchant.content}</p></div>
                  {isAdmin && <Button variant="destructive" size="sm" onClick={async () => { if (!window.confirm(t("confirmDeleteMerchant"))) return; const response = await fetch(`/api/promotions/merchants/${merchant.id}`, { method: "DELETE" }); if (response.ok) setMerchants((current) => current.filter((item) => item.id !== merchant.id)); }}><Trash2 className="h-4 w-4" />{t("delete")}</Button>}
                </CardHeader>
                {posters.length > 0 && (
                  <CardContent>
                    <div className={`grid gap-4 ${posters.length === 1 ? "grid-cols-1" : posters.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                      {posters.map((poster, index) => (
                        <button key={index} type="button" onClick={() => setExpandedPoster(poster)} className="group overflow-hidden rounded-xl border border-border bg-background text-left">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={poster} alt={t("posterAlt", { merchant: merchant.merchantName, index: index + 1 })} className="h-auto max-h-[34rem] w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!loading && isAdmin && vipItems.length > 0 && (
        <Card className="mt-8 border-border bg-card/75">
          <CardHeader><CardTitle>{t("vipList")}</CardTitle></CardHeader>
          <CardContent><ul className="divide-y divide-border">{vipItems.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground">{item.content}</p></div><Button variant="destructive" size="sm" onClick={async () => { if (!window.confirm(t("confirmDeleteVip"))) return; const response = await fetch(`/api/promotions/vip/${item.id}`, { method: "DELETE" }); if (response.ok) setVipItems((current) => current.filter((ad) => ad.id !== item.id)); }}><Trash2 className="h-4 w-4" />{t("delete")}</Button></li>)}</ul></CardContent>
        </Card>
      )}

      {expandedPoster && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpandedPoster(null); }}><Button className="absolute right-4 top-4" variant="secondary" size="icon" onClick={() => setExpandedPoster(null)} aria-label={t("close")}><X className="h-5 w-5" /></Button>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={expandedPoster} alt={t("expandedPoster")} className="max-h-[92vh] max-w-[96vw] rounded-lg object-contain" /></div>}
    </main>
  );
}

function MerchantForm({ onCreated }: { onCreated: (item: MerchantPromotionDTO) => void }) {
  const t = useTranslations("hotspots");
  const [merchantName, setMerchantName] = useState("");
  const [content, setContent] = useState("");
  const [posters, setPosters] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(false);
    try { const response = await fetch("/api/promotions/merchants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchantName, content, posters }) }); if (!response.ok) throw new Error(); const item = (await response.json()) as MerchantPromotionDTO; onCreated(item); setMerchantName(""); setContent(""); setPosters([]); } catch { setError(true); } finally { setSaving(false); }
  }

  return <Card className="border-border bg-card/75"><CardHeader><CardTitle>{t("addMerchant")}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="merchant-name">{t("merchantName")}</Label><Input id="merchant-name" required maxLength={80} value={merchantName} onChange={(e) => setMerchantName(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="merchant-content">{t("content")}</Label><Textarea id="merchant-content" required maxLength={2000} rows={5} value={content} onChange={(e) => setContent(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="merchant-posters" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"><ImagePlus className="h-4 w-4" />{t("selectPosters")}</Label><Input id="merchant-posters" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (event) => { try { const files = Array.from(event.target.files || []).slice(0, 3); setPosters(await Promise.all(files.map(compressImageFile))); setError(false); } catch { setError(true); } }} /><p className="text-xs text-muted-foreground">{t("posterHint", { count: posters.length })}</p>{posters.length > 0 && <div className="flex gap-2">{posters.map((poster, index) => <div key={index} className="relative h-24 w-24 overflow-hidden rounded-md border border-border">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={poster} alt="" className="h-full w-full object-cover" /><button type="button" className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white" onClick={() => setPosters((current) => current.filter((_, i) => i !== index))}><X className="h-3 w-3" /></button></div>)}</div>}</div>{error && <p className="text-sm text-red-400">{t("saveFailed")}</p>}<Button type="submit" disabled={saving}><Plus className="h-4 w-4" />{saving ? t("saving") : t("saveMerchant")}</Button></form></CardContent></Card>;
}

function VipForm({ onCreated }: { onCreated: (item: VipAdvertisementDTO) => void }) {
  const t = useTranslations("hotspots");
  const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(false); try { const response = await fetch("/api/promotions/vip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) }); if (!response.ok) throw new Error(); const item = (await response.json()) as VipAdvertisementDTO; onCreated(item); setTitle(""); setContent(""); } catch { setError(true); } finally { setSaving(false); } }
  return <Card className="border-border bg-card/75"><CardHeader><CardTitle>{t("addVip")}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="vip-title">{t("vipTitle")}</Label><Input id="vip-title" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="vip-content">{t("vipContent")}</Label><Textarea id="vip-content" required maxLength={300} rows={3} value={content} onChange={(e) => setContent(e.target.value)} /></div>{error && <p className="text-sm text-red-400">{t("saveFailed")}</p>}<Button type="submit" disabled={saving}><Plus className="h-4 w-4" />{saving ? t("saving") : t("saveVip")}</Button></form></CardContent></Card>;
}
