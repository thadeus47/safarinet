import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getViewer, safeNext } from "@/lib/auth/session";
import { register } from "../actions";

export const metadata: Metadata = { title: "Create an account · Safarinet" };

export default async function Page({ searchParams }: PageProps<"/register">) {
  const next = safeNext((await searchParams).next);
  // Already signed in: skip the form.
  if (await getViewer()) redirect(next);
  return (
    <>
      <h1 className="font-display text-3xl">Create your free account</h1>
      <p className="mt-2 mb-8 text-ink/70">It takes a few seconds, and opens the map straight away.</p>
      <AuthForm mode="register" action={register} next={next} />
    </>
  );
}
