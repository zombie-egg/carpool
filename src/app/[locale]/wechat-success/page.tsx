"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";

export default function WechatSuccessPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[75vh] w-full max-w-md items-center px-4 pb-36 pt-16">
      <Card className="w-full border-border bg-card/80 text-center backdrop-blur">
        <CardContent className="space-y-4 pt-8">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#07c160]" />
          <h1 className="text-2xl font-semibold">{t("wechatSuccessTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("wechatSuccessMessage")}</p>
          <p className="text-xs text-[#07c160]">{t("wechatSuccessRedirecting")}</p>
          <Button asChild className="w-full">
            <Link href="/">{t("wechatSuccessHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
