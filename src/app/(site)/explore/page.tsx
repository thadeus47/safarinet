import type { Metadata } from "next";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { MapExperience } from "@/components/map/MapExperience";
import { requireViewer } from "@/lib/auth/session";
import { getMapData } from "@/lib/content/view";

export const metadata: Metadata = { title: "The map · Safarinet" };

/** The map is for signed-in visitors only. */
export default async function Explore() {
  const viewer = await requireViewer("/explore");
  const { regions, cardsByRegion } = await getMapData();
  return (
    <main>
      <MapExperience regions={regions} cardsByRegion={cardsByRegion} account={<AccountMenu name={viewer.name} />} />
    </main>
  );
}
