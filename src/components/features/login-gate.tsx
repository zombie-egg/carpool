"use client";

import { Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/features/use-session";
import type { SessionUserDTO } from "@/lib/types";

interface LoginGateProps {
  // Bilingual prompt shown when the visitor is logged out.
  message: string;
  children: (user: SessionUserDTO) => React.ReactNode;
}

// Renders children only for logged-in users; otherwise shows a login prompt.
export function LoginGate({ message, children }: LoginGateProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{tCommon("loading")}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/70 px-6 py-16 text-center backdrop-blur">
        <Lock className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">{message}</p>
        <Button asChild>
          <Link href="/login">{t("login")}</Link>
        </Button>
      </div>
    );
  }

  return <>{children(user)}</>;
}
