import { MapExperience } from "@/components/map/MapExperience";
import { getMapData } from "@/lib/content/view";

export default async function Home() {
  const { regions, cardsByRegion } = await getMapData();
  return (
    <main>
      <MapExperience regions={regions} cardsByRegion={cardsByRegion} />
    </main>
  );
}
