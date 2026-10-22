"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "idle" | "error" | "info"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  function validEmail(): string | null {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return null;
    }
    return trimmed;
  }

  function validPassword(): boolean {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus({
        kind: "error",
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
      return false;
    }
    return true;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setStatus({ kind: "idle", message: "" });
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = validEmail();
    if (!address || !validPassword()) return;

    void run(async () => {
      const { error } = await createClient().auth.signInWithPassword({
        email: address,
        password,
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  function handleCreateAccount() {
    const address = validEmail();
    if (!address || !validPassword()) return;

    void run(async () => {
      const { data, error } = await createClient().auth.signUp({
        email: address,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }
      setStatus({
        kind: "info",
        message: "Check your email to confirm your account.",
      });
    });
  }

  function handleMagicLink() {
    const address = validEmail();
    if (!address) return;

    void run(async () => {
      const { error } = await createClient().auth.signInWithOtp({
        email: address,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setStatus(
        error
          ? { kind: "error", message: error.message }
          : { kind: "info", message: "Magic link sent. Check your email." },
      );
    });
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-hairline bg-surface px-4 text-[17px] text-primary outline-none focus:border-accent md:text-[15px]";
  const secondaryButtonClass =
    "h-11 w-full rounded-xl bg-subtle text-[15px] font-semibold text-primary disabled:opacity-50";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">Pulse</h1>
      <p className="mt-1 text-[15px] text-secondary">
        Sign in to sync your tasks and budget across devices.
      </p>

      <form onSubmit={handleSignIn} className="mt-8 flex flex-col gap-3" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-secondary">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 h-11 w-full rounded-xl bg-accent-fill text-[15px] font-semibold text-white disabled:opacity-50"
        >
          Sign In
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleCreateAccount}
          className={secondaryButtonClass}
        >
          Create Account
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleMagicLink}
          className={secondaryButtonClass}
        >
          Send Magic Link
        </button>
      </form>

      <p
        role={status.kind === "error" ? "alert" : "status"}
        aria-live="polite"
        className={`mt-4 min-h-5 text-[15px] ${status.kind === "error" ? "text-danger" : "text-secondary"}`}
      >
        {status.message}
      </p>
    </main>
  );
}
