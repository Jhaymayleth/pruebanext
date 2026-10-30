"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  endSession,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  syncSession,
  type SessionSnapshot,
} from "@/lib/session-store";

export type { SessionSnapshot, SessionStatus, SessionUser } from "@/lib/session-store";

export function useSession(): SessionSnapshot & { logout: () => Promise<void> } {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void syncSession();

    const syncOnRestore = () => {
      void syncSession();
    };

    const syncOnVisible = () => {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    };

    window.addEventListener("pageshow", syncOnRestore);
    document.addEventListener("visibilitychange", syncOnVisible);

    return () => {
      window.removeEventListener("pageshow", syncOnRestore);
      document.removeEventListener("visibilitychange", syncOnVisible);
    };
  }, []);

  async function logout() {
    await endSession();
    router.replace("/");
    router.refresh();
  }

  return { ...snapshot, logout };
}