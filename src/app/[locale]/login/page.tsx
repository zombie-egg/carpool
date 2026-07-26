"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";
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

// Email + password login page.
export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError(t("errors.required"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(
          t(
            data.error === "invalid_credentials"
              ? "errors.invalid_credentials"
              : "errors.login_failed"
          )
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(t("errors.login_failed"));
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
            <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  placeholder={t("emailPlaceholder")}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  placeholder={t("passwordPlaceholder")}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {submitting ? t("loggingIn") : t("login")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/register"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {t("toRegister")}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
