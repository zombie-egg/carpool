"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, Smartphone, X } from "lucide-react";
import QRCode from "qrcode";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function WechatAuthButton({ mode, role = "customer" }: { mode: "login" | "register"; role?: "customer" | "driver" }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [authorizeUrl, setAuthorizeUrl] = useState("");
  const [error, setError] = useState(false);
  const [mobileBrowser, setMobileBrowser] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollTimer = useRef<number | null>(null);

  function stopPolling() {
    if (pollTimer.current !== null) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  async function openWechat() {
    const directUrl = `/api/auth/wechat?locale=${locale}&role=${role}`;
    if (/MicroMessenger/i.test(navigator.userAgent)) {
      window.location.href = directUrl;
      return;
    }

    setMobileBrowser(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

    setOpen(true);
    setLoading(true);
    setError(false);
    setQrDataUrl("");
    stopPolling();
    try {
      const response = await fetch("/api/auth/wechat/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, role }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as {
        token: string;
        authorizeUrl: string;
      };
      setAuthorizeUrl(data.authorizeUrl);
      setQrDataUrl(
        await QRCode.toDataURL(data.authorizeUrl, {
          width: 360,
          margin: 2,
          errorCorrectionLevel: "H",
        })
      );
      pollTimer.current = window.setInterval(async () => {
        const poll = await fetch(
          `/api/auth/wechat/qr?token=${encodeURIComponent(data.token)}`,
          { cache: "no-store" }
        );
        if (poll.status === 410) {
          stopPolling();
          setError(true);
          return;
        }
        if (!poll.ok) return;
        const result = (await poll.json()) as { status: string };
        if (result.status === "authorized") {
          stopPolling();
          setOpen(false);
          router.push("/");
          router.refresh();
        }
      }, 2000);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function copyAndOpenWechat() {
    try {
      await navigator.clipboard.writeText(authorizeUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    window.location.href = "weixin://";
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => void openWechat()}
        className="mb-4 w-full bg-[#07c160] text-white hover:bg-[#06ad56]"
      >
        <MessageCircle className="h-4 w-4" />
        {t(mode === "login" ? "wechatLogin" : "wechatRegister")}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t("wechatQrTitle")}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              stopPolling();
              setOpen(false);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-2xl">
            <div className="flex items-start justify-between gap-4 text-left">
              <div>
                <h2 className="text-lg font-semibold">{t("wechatQrTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("wechatQrSubtitle")}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => { stopPolling(); setOpen(false); }} aria-label={t("close")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="my-5 flex min-h-64 items-center justify-center rounded-lg bg-white p-3">
              {loading && <Loader2 className="h-7 w-7 animate-spin text-black" />}
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={t("wechatQrAlt")} className="h-auto w-full max-w-64" />
              )}
            </div>
            {error ? (
              <p className="text-sm text-red-400">{t("wechatQrExpired")}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("wechatQrWaiting")}</p>
            )}
            {authorizeUrl && mobileBrowser && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">{t("mobileWechatHint")}</p>
                <Button type="button" variant="outline" className="w-full" onClick={() => void copyAndOpenWechat()}>
                  {copied ? <Copy className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  {copied ? t("wechatLinkCopied") : t("copyOpenWechat")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
