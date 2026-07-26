"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionUserDTO } from "@/lib/types";

export interface SessionState {
  user: SessionUserDTO | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Client-side session state, backed by GET /api/auth/me.
export function useSession(): SessionState {
  const [user, setUser] = useState<SessionUserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as { user: SessionUserDTO | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
