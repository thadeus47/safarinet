"use server";

import config from "@payload-config";
import { login, logout } from "@payloadcms/next/auth";
import { redirect } from "next/navigation";
import { getPayload, LockedAuth, ValidationError } from "payload";
import { MIN_PASSWORD } from "@/lib/auth/rules";
import { safeNext } from "@/lib/auth/session";

export type AuthState = { error?: string; email?: string; name?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!EMAIL.test(email) || !password) return { error: "Enter your email and password.", email };

  try {
    await login({ collection: "travelers", config, email, password });
  } catch (e) {
    return {
      email,
      error: e instanceof LockedAuth
        ? "Too many attempts. Try again in 10 minutes."
        : "That email and password don't match an account.",
    };
  }
  redirect(safeNext(form.get("next")));
}

export async function register(_prev: AuthState, form: FormData): Promise<AuthState> {
  const name = field(form, "name");
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name) return { error: "Tell us your name.", email, name };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", email, name };
  if (password.length < MIN_PASSWORD) {
    return { error: `Use a password of at least ${MIN_PASSWORD} characters.`, email, name };
  }

  const payload = await getPayload({ config });
  try {
    await payload.create({ collection: "travelers", data: { name, email, password } });
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: "An account with that email already exists. Sign in instead.", email, name };
    }
    throw e;
  }
  await login({ collection: "travelers", config, email, password });
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await logout({ config });
  redirect("/");
}
