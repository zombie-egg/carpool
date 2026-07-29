"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MailCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WechatAuthButton } from "@/components/features/wechat-auth-button";

const AUTH_ERROR_KEYS = [
  "invalid_email",
  "email_exists",
  "rate_limited",
  "send_failed",
  "invalid_code",
  "nickname_required",
  "password_too_short",
  "register_failed",
] as const;

function toErrorKey(code: string | undefined, fallback: string): string {
  return AUTH_ERROR_KEYS.includes(code as (typeof AUTH_ERROR_KEYS)[number])
    ? `errors.${code}`
    : `errors.${fallback}`;
}

// Email registration page: send code -> verify -> create account.
export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(
      () => setCooldown((value) => value - 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleSendCode() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError(t("errors.invalid_email"));
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(t(toErrorKey(data.error, "send_failed")));
        return;
      }
      setInfo(t("codeSent"));
      setCooldown(60);
    } catch {
      setError(t("errors.send_failed"));
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !code.trim() || !nickname.trim() || !password) {
      setError(t("errors.required"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, nickname, password }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(t(toErrorKey(data.error, "register_failed")));
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(t("errors.register_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 pb-36 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full"
      >
        <Card className="border-border bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
            <CardDescription>{t("registerSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <WechatAuthButton mode="register" />
            <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("orEmail")}
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="register-email">{t("email")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    placeholder={t("emailPlaceholder")}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={sending || cooldown > 0}
                    onClick={() => void handleSendCode()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MailCheck className="h-4 w-4" />
                    )}
                    {sending
                      ? t("sending")
                      : cooldown > 0
                        ? t("resendIn", { seconds: cooldown })
                        : t("sendCode")}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-code">{t("code")}</Label>
                <Input
                  id="register-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  placeholder={t("codePlaceholder")}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-nickname">{t("nickname")}</Label>
                <Input
                  id="register-nickname"
                  value={nickname}
                  placeholder={t("nicknamePlaceholder")}
                  onChange={(event) => setNickname(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-password">{t("password")}</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  placeholder={t("passwordPlaceholder")}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {info && <p className="text-sm text-emerald-400">{info}</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {submitting ? t("registering") : t("register")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {t("toLogin")}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
