"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Turnstile, { TURNSTILE_SITE_KEY } from "./Turnstile";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const onToken = useCallback((t: string) => setTurnstileToken(t), []);
  const captchaPending =
    mode === "register" && !!TURNSTILE_SITE_KEY && !turnstileToken;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "register"
          ? { email, username, password, turnstileToken }
          : { email, password }
      ),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Etwas ist schiefgelaufen.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-sep bg-card px-4 py-3.5 text-[16px] outline-none placeholder:text-ink-3 focus:border-tint focus:ring-2 focus:ring-tint/30";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pb-16">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#0a84ff] to-[#0040dd] text-[40px] shadow-lg">
          ⚽️
        </div>
        <h1 className="text-[28px] font-bold tracking-tight">WM Tippspiel 2026</h1>
        <p className="mt-1 text-[15px] text-ink-2">
          {mode === "login"
            ? "Melde dich an und tippe weiter."
            : "Erstelle deinen Account und tippe mit."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          className={field}
          type="email"
          placeholder="E-Mail"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode === "register" && (
          <input
            className={field}
            type="text"
            placeholder="Benutzername"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={20}
            required
          />
        )}
        <input
          className={field}
          type="password"
          placeholder={mode === "register" ? "Passwort (min. 8 Zeichen)" : "Passwort"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === "register" ? 8 : undefined}
          required
        />

        {mode === "register" && <Turnstile onToken={onToken} />}

        {error && (
          <p className="rounded-xl bg-red/10 px-4 py-3 text-[14px] font-medium text-red">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || captchaPending}
          className="w-full rounded-xl bg-tint py-3.5 text-[17px] font-semibold text-white transition-opacity active:opacity-70 disabled:opacity-50"
        >
          {busy ? "Einen Moment …" : mode === "login" ? "Anmelden" : "Account erstellen"}
        </button>
      </form>

      <p className="mt-6 text-center text-[15px] text-ink-2">
        {mode === "login" ? (
          <>
            Noch kein Account?{" "}
            <Link href="/register" className="font-semibold text-tint">
              Registrieren
            </Link>
          </>
        ) : (
          <>
            Schon dabei?{" "}
            <Link href="/login" className="font-semibold text-tint">
              Anmelden
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
