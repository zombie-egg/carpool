"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { Check, Flame, ImagePlus, Images, Loader2, Plus, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/components/features/use-session";
import { VipImageCropper } from "@/components/features/vip-image-cropper";
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
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantPromotionDTO | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [merchantResponse, vipResponse] = await Promise.all([
        fetch("/api/promotions/merchants", { cache: "force-cache" }),
        fetch("/api/promotions/vip", { cache: "force-cache" }),
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {merchants.map((merchant) => {
            const posters = [merchant.poster1, merchant.poster2, merchant.poster3, merchant.poster4].filter(Boolean) as string[];
            const coverIndex = Math.min(merchant.coverIndex || 0, Math.max(0, posters.length - 1));
            const cover = posters[coverIndex];
            const stackedPosters = posters.filter((_, index) => index !== coverIndex).slice(0, 3);
            return (
              <Card key={merchant.id} role="button" tabIndex={0} onClick={() => setSelectedMerchant(merchant)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedMerchant(merchant); }} className="group flex h-[28rem] cursor-pointer flex-col overflow-hidden border-border bg-card/75 backdrop-blur transition-transform hover:-translate-y-1 hover:shadow-xl">
                <div className="relative mx-4 mt-4 h-56 shrink-0">
                  {stackedPosters.map((poster, index) => <img key={poster} src={poster} alt="" className="absolute inset-x-3 h-full w-[calc(100%-1.5rem)] rounded-xl border border-border object-cover shadow-md" style={{ top: `${(stackedPosters.length - index) * 5}px`, transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)` }} />)}
                  {cover ? <img src={cover} alt={t("posterAlt", { merchant: merchant.merchantName, index: coverIndex + 1 })} className="relative z-10 h-[calc(100%-1rem)] w-full rounded-xl border border-border object-cover shadow-lg" /> : <div className="relative z-10 flex h-[calc(100%-1rem)] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground"><Images className="h-10 w-10" /></div>}
                  {posters.length > 1 && <span className="absolute bottom-5 right-2 z-20 rounded-full bg-black/65 px-2 py-1 text-xs text-white">{t("imageCount", { count: posters.length })}</span>}
                </div>
                <CardHeader className="min-h-0 flex-1 pb-5 pt-2">
                  <div className="flex items-start justify-between gap-2"><CardTitle className="line-clamp-1">{merchant.merchantName}</CardTitle>{isAdmin && <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={async (event) => { event.stopPropagation(); if (!window.confirm(t("confirmDeleteMerchant"))) return; const response = await fetch(`/api/promotions/merchants/${merchant.id}`, { method: "DELETE" }); if (response.ok) setMerchants((current) => current.filter((item) => item.id !== merchant.id)); }} aria-label={t("delete")}><Trash2 className="h-4 w-4" /></Button>}</div>
                  <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{merchant.content}</p>
                  <span className="mt-auto pt-3 text-sm font-medium text-emerald-500">{t("viewDetails")}</span>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && isAdmin && vipItems.length > 0 && (
        <Card className="mt-8 border-border bg-card/75">
          <CardHeader><CardTitle>{t("vipList")}</CardTitle></CardHeader>
          <CardContent><ul className="divide-y divide-border">{vipItems.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0 flex-1">{item.imageData ? <img src={item.imageData} alt={t("vipImageAlt")} className="h-16 w-full rounded-lg object-cover" /> : <p className="text-sm text-muted-foreground">{t("legacyVip")}</p>}</div><Button variant="destructive" size="sm" onClick={async () => { if (!window.confirm(t("confirmDeleteVip"))) return; const response = await fetch(`/api/promotions/vip/${item.id}`, { method: "DELETE" }); if (response.ok) setVipItems((current) => current.filter((ad) => ad.id !== item.id)); }}><Trash2 className="h-4 w-4" />{t("delete")}</Button></li>)}</ul></CardContent>
        </Card>
      )}

      {expandedPoster && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpandedPoster(null); }}><Button className="absolute right-4 top-4" variant="secondary" size="icon" onClick={() => setExpandedPoster(null)} aria-label={t("close")}><X className="h-5 w-5" /></Button>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={expandedPoster} alt={t("expandedPoster")} className="max-h-[92vh] max-w-[96vw] rounded-lg object-contain" /></div>}
      {selectedMerchant && <MerchantDetail merchant={selectedMerchant} onClose={() => setSelectedMerchant(null)} onExpand={setExpandedPoster} />}
    </main>
  );
}

function MerchantDetail({ merchant, onClose, onExpand }: { merchant: MerchantPromotionDTO; onClose: () => void; onExpand: (poster: string) => void }) {
  const t = useTranslations("hotspots");
  const posters = [merchant.poster1, merchant.poster2, merchant.poster3, merchant.poster4].filter(Boolean) as string[];
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-card"><CardHeader className="sticky top-0 z-20 flex-row items-center justify-between space-y-0 border-b border-border bg-card/95 backdrop-blur"><CardTitle>{merchant.merchantName}</CardTitle><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t("close")}><X className="h-5 w-5" /></Button></CardHeader><CardContent className="space-y-6 pt-6">{posters.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{posters.map((poster, index) => <button key={poster} type="button" onClick={() => onExpand(poster)} className="overflow-hidden rounded-xl border border-border bg-background"><img src={poster} alt={t("posterAlt", { merchant: merchant.merchantName, index: index + 1 })} className="h-64 w-full object-cover transition-transform hover:scale-[1.02]" /></button>)}</div>}<p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{merchant.content}</p></CardContent></Card></div>;
}

function MerchantForm({ onCreated }: { onCreated: (item: MerchantPromotionDTO) => void }) {
  const t = useTranslations("hotspots");
  const [merchantName, setMerchantName] = useState("");
  const [content, setContent] = useState("");
  const [posters, setPosters] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(false);
    try { const response = await fetch("/api/promotions/merchants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchantName, content, posters, coverIndex }) }); if (!response.ok) throw new Error(); const item = (await response.json()) as MerchantPromotionDTO; onCreated(item); setMerchantName(""); setContent(""); setPosters([]); setCoverIndex(0); } catch { setError(true); } finally { setSaving(false); }
  }

  return <Card className="border-border bg-card/75"><CardHeader><CardTitle>{t("addMerchant")}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="merchant-name">{t("merchantName")}</Label><Input id="merchant-name" required maxLength={80} value={merchantName} onChange={(e) => setMerchantName(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="merchant-content">{t("content")}</Label><Textarea id="merchant-content" required maxLength={2000} rows={5} value={content} onChange={(e) => setContent(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="merchant-posters" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"><ImagePlus className="h-4 w-4" />{t("selectPosters")}</Label><Input id="merchant-posters" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (event) => { try { const files = Array.from(event.target.files || []).slice(0, 4); setPosters(await Promise.all(files.map(compressImageFile))); setCoverIndex(0); setError(false); } catch { setError(true); } }} /><p className="text-xs text-muted-foreground">{t("posterHint", { count: posters.length })}</p>{posters.length > 0 && <div><p className="mb-2 text-sm font-medium">{t("chooseCover")}</p><div className="flex flex-wrap gap-3">{posters.map((poster, index) => <div key={index} className={`relative h-28 w-28 overflow-hidden rounded-md border-2 ${coverIndex === index ? "border-emerald-500" : "border-border"}`}><img src={poster} alt="" className="h-full w-full object-cover" /><button type="button" className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 text-xs text-white" onClick={() => setCoverIndex(index)}>{coverIndex === index && <Check className="mr-1 h-4 w-4" />}{coverIndex === index ? t("selectedCover") : t("setCover")}</button><button type="button" className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white" onClick={() => { setPosters((current) => current.filter((_, i) => i !== index)); setCoverIndex((current) => current === index ? 0 : current > index ? current - 1 : current); }}><X className="h-3 w-3" /></button></div>)}</div></div>}</div>{error && <p className="text-sm text-red-400">{t("saveFailed")}</p>}<Button type="submit" disabled={saving}><Plus className="h-4 w-4" />{saving ? t("saving") : t("saveMerchant")}</Button></form></CardContent></Card>;
}

function VipForm({ onCreated }: { onCreated: (item: VipAdvertisementDTO) => void }) {
  const t = useTranslations("hotspots");
  const [cropSource, setCropSource] = useState<string | null>(null); const [imageData, setImageData] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!imageData) { setError(true); return; } setSaving(true); setError(false); try { const response = await fetch("/api/promotions/vip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData }) }); if (!response.ok) throw new Error(); const item = (await response.json()) as VipAdvertisementDTO; onCreated(item); setImageData(""); } catch { setError(true); } finally { setSaving(false); } }
  return <><Card className="border-border bg-card/75"><CardHeader><CardTitle>{t("addVip")}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="vip-image" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"><ImagePlus className="h-4 w-4" />{t("selectVipImage")}</Label><Input id="vip-image" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setCropSource(String(reader.result)); reader.onerror = () => setError(true); reader.readAsDataURL(file); event.target.value = ""; }} /><p className="text-xs text-muted-foreground">{t("vipImageHint")}</p>{imageData && <img src={imageData} alt={t("vipImageAlt")} className="aspect-[5/2] w-full max-w-xl rounded-lg border border-border bg-black object-contain" />}</div>{error && <p className="text-sm text-red-400">{t("saveFailed")}</p>}<Button type="submit" disabled={saving || !imageData}><Plus className="h-4 w-4" />{saving ? t("saving") : t("saveVip")}</Button></form></CardContent></Card>{cropSource && <VipImageCropper source={cropSource} hint={t("cropHint")} cancelLabel={t("cropCancel")} confirmLabel={t("cropConfirm")} onCancel={() => setCropSource(null)} onConfirm={(cropped) => { setImageData(cropped); setCropSource(null); setError(false); }} />}</>;
}
