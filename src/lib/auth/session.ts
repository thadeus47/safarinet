import "server-only";
import config from "@payload-config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";

export type Viewer = { id: number; name: string; email: string };

/** The signed-in traveler (or staff member) for this request, or null. Verified, not just read from the cookie. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) return null;
  return { id: user.id, name: user.name || user.email.split("@")[0], email: user.email };
});

/** For pages only signed-in visitors may see. Sends everyone else to sign in, then back here. */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

/** Only same-site paths, so `?next=` can't send people to another site after signing in. */
export function safeNext(next: unknown, fallback = "/explore"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}
