import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getViewer, safeNext } from "@/lib/auth/session";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in · Safarinet" };

export default async function Page({ searchParams }: PageProps<"/signin">) {
  const next = safeNext((await searchParams).next);
  // Already signed in: skip the form.
  if (await getViewer()) redirect(next);
  return (
    <>
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mt-2 mb-8 text-ink/70">Sign in to open the map.</p>
      <AuthForm mode="signin" action={signIn} next={next} />
    </>
  );
}
