import { MapExperience } from "@/components/map/MapExperience";
import { getMapData } from "@/lib/content/view";

export default function Home() {
  const { regions, cardsByRegion } = getMapData();
  return (
    <main>
      <MapExperience regions={regions} cardsByRegion={cardsByRegion} />
    </main>
  );
}
