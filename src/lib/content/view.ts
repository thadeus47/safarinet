import type { DestinationCard, MapRegion } from "@/components/map/types";
import { distanceKm, NAIROBI } from "@/lib/geo";
import { fromPricePerPerson } from "@/lib/pricing/quote";
import { getExperiencesByRegion, getRegions } from "./repo";
import type { Experience, ExperienceType, RegionWithStatus } from "./types";

// Shapes domain data into the serializable props the UI needs.

export const TYPE_LABELS: Record<ExperienceType, string> = {
  game_drive: "Game drive",
  guided_walk: "Guided walk",
  cultural_visit: "Cultural visit",
  day_trip: "Day trip",
  activity: "Activity",
  stay: "Stay",
};

export function experienceHref(e: Experience): string {
  return `/${e.regionSlug}/${e.slug}`;
}

export function toCard(e: Experience): DestinationCard {
  return {
    href: experienceHref(e),
    title: e.title,
    summary: e.summary,
    typeLabel: TYPE_LABELS[e.type],
    distanceKm: distanceKm(NAIROBI, e.location),
    fromKes: fromPricePerPerson(e),
  };
}

export function toMapRegion(r: RegionWithStatus): MapRegion {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    status: r.status,
    center: r.center,
    liteZoom: r.liteZoom,
  };
}

export function getMapData() {
  const regions = getRegions();
  const cardsByRegion: Record<string, DestinationCard[]> = {};
  for (const r of regions) {
    // Coming-soon regions show no cards, even if some partners are already signed.
    cardsByRegion[r.slug] = r.status === "live" ? getExperiencesByRegion(r.slug).map(toCard) : [];
  }
  return { regions: regions.map(toMapRegion), cardsByRegion };
}
