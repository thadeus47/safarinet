"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AuthState } from "@/app/(site)/(auth)/actions";
import { MIN_PASSWORD } from "@/lib/auth/rules";

type Mode = "signin" | "register";

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-ink/20 bg-white px-3.5 py-3 text-base text-ink placeholder:text-ink/40 transition-colors duration-200 focus:border-acacia focus:ring-2 focus:ring-acacia/30 focus:outline-none";

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: Mode;
  action: (state: AuthState, form: FormData) => Promise<AuthState>;
  next: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [showPassword, setShowPassword] = useState(false);
  const register = mode === "register";
  const otherHref = `${register ? "/signin" : "/register"}${next === "/explore" ? "" : `?next=${encodeURIComponent(next)}`}`;

  return (
    <form action={formAction} className="space-y-5" noValidate={false}>
      <input type="hidden" name="next" value={next} />

      {register && (
        <label className="block text-sm font-medium">
          Your name
          <input
            name="name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            defaultValue={state.name}
            className={inputClass}
          />
        </label>
      )}

      <label className="block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          className={inputClass}
        />
      </label>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={register ? MIN_PASSWORD : undefined}
            autoComplete={register ? "new-password" : "current-password"}
            aria-describedby={register ? "password-hint" : undefined}
            className={`${inputClass} pr-20`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-1.5 my-auto h-9 cursor-pointer rounded-lg px-3 text-xs font-medium text-ink/70 transition-colors duration-200 hover:bg-ink/5 hover:text-ink"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {register && (
          <p id="password-hint" className="mt-1.5 text-xs text-ink/60">
            At least {MIN_PASSWORD} characters.
          </p>
        )}
      </div>

      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-acacia px-5 py-3.5 font-medium text-white transition-colors duration-200 hover:bg-[#a9541a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acacia disabled:cursor-wait disabled:opacity-70"
      >
        {pending && (
          <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {pending ? (register ? "Creating your account…" : "Signing in…") : register ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-sm text-ink/70">
        {register ? "Already have an account? " : "New to Safarinet? "}
        <Link href={otherHref} className="font-medium text-acacia underline-offset-4 hover:underline">
          {register ? "Sign in" : "Create a free account"}
        </Link>
      </p>
    </form>
  );
}
