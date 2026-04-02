"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type DemoSessionState = {
  isReady: boolean;
  session: Session | null;
  accessToken: string | null;
  email: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const DemoSessionContext = createContext<DemoSessionState | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isReady, setIsReady] = useState(() => !supabase);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setIsReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setIsReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const value: DemoSessionState = useMemo(() => {
    const accessToken = session?.access_token ?? null;
    const email = session?.user?.email ?? null;
    return {
      isReady,
      session,
      accessToken,
      email,
      refresh: async () => {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      },
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    };
  }, [isReady, session, supabase]);

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession(): DemoSessionState {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) {
    throw new Error("useDemoSession must be used within DemoSessionProvider");
  }
  return ctx;
}

