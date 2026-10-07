import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

// Public pages are statically generated from Payload content. When an editor saves or
// deletes anything that appears on them, rebuild every page on the next request.
// Content is small and changes rarely, so revalidating everything is the simple, safe choice.

function revalidateSite() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // Outside a Next.js request (e.g. `npm run seed`) there is nothing to revalidate.
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateSite();
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateSite();
  return doc;
};
