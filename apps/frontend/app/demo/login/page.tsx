"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageEnter from "@/components/PageEnter";
import { useDemoSession } from "@/context/DemoSessionContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function DemoLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { isReady, email, accessToken, signOut } = useDemoSession();

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPassword, setDraftPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (accessToken) {
      // client can immediately proceed after login
      router.replace("/demo/my-downloads");
    }
  }, [accessToken, isReady, router]);

  async function handlePasswordLogin() {
    setMessage(null);
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error(
          "Supabase demo login is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: draftEmail.trim(),
        password: draftPassword,
      });
      if (error) throw error;
      setMessage("Signed in. Redirecting…");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setMessage(null);
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error(
          "Supabase demo login is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: draftEmail.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/demo/my-downloads" : undefined,
        },
      });
      if (error) throw error;
      setMessage("Magic link sent. Check your inbox.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageEnter>
      <div className="max-w-[900px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
            Demo login
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Sign in with a test account. This is only for the Milestone 3 demo UI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-200/90 bg-indigo-50 text-indigo-700">
                <KeyRound className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-950">
                  Authenticate
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  Choose password login or a magic link.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Button
                type="button"
                variant={mode === "password" ? "solid" : "outline"}
                onClick={() => setMode("password")}
              >
                Password
              </Button>
              <Button
                type="button"
                variant={mode === "magic" ? "solid" : "outline"}
                onClick={() => setMode("magic")}
              >
                Magic link
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <div className="text-xs font-semibold text-zinc-700">Email</div>
                <Input
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  placeholder="client-test@example.com"
                />
              </div>

              {mode === "password" ? (
                <div>
                  <div className="text-xs font-semibold text-zinc-700">Password</div>
                  <Input
                    type="password"
                    value={draftPassword}
                    onChange={(e) => setDraftPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  disabled={loading || !draftEmail.trim() || (mode === "password" && !draftPassword)}
                  onClick={mode === "password" ? handlePasswordLogin : handleMagicLink}
                >
                  {loading ? "Working…" : mode === "password" ? "Sign in" : "Send link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/demo/status")}
                >
                  Open status
                </Button>
              </div>

              {message ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                  {message}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold text-zinc-950">
              Current session
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              {isReady ? (email ? "Signed in" : "Not signed in") : "Loading…"}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div>
                <span className="text-zinc-500">Email:</span>{" "}
                <span className="font-medium text-zinc-900">{email ?? "—"}</span>
              </div>
              <div>
                <span className="text-zinc-500">Access token:</span>{" "}
                <span className="font-mono text-xs text-zinc-700">
                  {accessToken ? `${accessToken.slice(0, 16)}…` : "—"}
                </span>
              </div>
            </div>

            {email ? (
              <div className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await signOut();
                    setMessage("Signed out.");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  Sign out
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </PageEnter>
  );
}

