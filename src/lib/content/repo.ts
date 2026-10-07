import "server-only";
import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";
import type {
  Experience as ExperienceDoc,
  Partner as PartnerDoc,
  Region as RegionDoc,
} from "@/payload-types";
import type { Experience, RegionWithStatus } from "./types";

// Read API for content, backed by Payload's local API (no HTTP round trip).
// Every page and component reads content through these functions, which map
// Payload documents onto the domain types in ./types.

/** A region goes live once it has at least this many signed partners (PRD MAP-3). */
export const GO_LIVE_PARTNER_THRESHOLD = 5;

const payload = () => getPayload({ config });

const idOf = (value: number | { id: number } | null | undefined) =>
  value == null ? null : typeof value === "object" ? value.id : value;

type Snapshot = {
  regions: RegionWithStatus[];
  experiences: Experience[];
};

/**
 * Loads all regions, signed partners and experiences in three queries. The catalogue
 * is small (tens of rows), so one snapshot per request beats per-page queries.
 * `cache` dedupes it across every call within a single render.
 */
const loadSnapshot = cache(async (): Promise<Snapshot> => {
  const p = await payload();
  const [regionDocs, partnerDocs, experienceDocs] = await Promise.all([
    p.find({ collection: "regions", pagination: false, depth: 0, sort: "createdAt" }),
    p.find({
      collection: "partners",
      pagination: false,
      depth: 0,
      where: { contractSigned: { equals: true } },
      select: { region: true },
    }),
    p.find({ collection: "experiences", pagination: false, depth: 0, sort: "createdAt" }),
  ]);

  const signedByRegion = new Map<number, number>();
  for (const partner of partnerDocs.docs as Pick<PartnerDoc, "id" | "region">[]) {
    const regionId = idOf(partner.region);
    if (regionId != null) signedByRegion.set(regionId, (signedByRegion.get(regionId) ?? 0) + 1);
  }

  const slugById = new Map<number, string>();
  const regions = regionDocs.docs.map((doc: RegionDoc): RegionWithStatus => {
    slugById.set(doc.id, doc.slug);
    const partnerCount = signedByRegion.get(doc.id) ?? 0;
    return {
      slug: doc.slug,
      name: doc.name,
      tagline: doc.tagline,
      description: doc.description,
      center: { lat: doc.center.lat, lng: doc.center.lng },
      liteZoom: doc.liteZoom,
      partnerCount,
      status: partnerCount >= GO_LIVE_PARTNER_THRESHOLD ? "live" : "coming_soon",
    };
  });

  const experiences = experienceDocs.docs.flatMap((doc: ExperienceDoc): Experience[] => {
    const regionSlug = slugById.get(idOf(doc.region) ?? -1);
    if (!regionSlug) return [];
    return [toExperience(doc, regionSlug)];
  });

  return { regions, experiences };
});

function toExperience(doc: ExperienceDoc, regionSlug: string): Experience {
  return {
    slug: doc.slug,
    regionSlug,
    partnerId: String(idOf(doc.partner)),
    type: doc.type,
    title: doc.title,
    summary: doc.summary,
    description: doc.description,
    location: { lat: doc.location.lat, lng: doc.location.lng },
    durationHours: doc.durationHours,
    priceRules: doc.priceRules.map((r) => ({
      basis: r.basis,
      amountKes: r.amountKes,
      minGroup: r.minGroup ?? undefined,
      maxGroup: r.maxGroup ?? undefined,
      // A season only applies when both ends are set.
      season:
        r.season?.from && r.season?.to
          ? { from: r.season.from, to: r.season.to, label: r.season.label || "Seasonal rate" }
          : undefined,
    })),
    fees: (doc.fees ?? []).map((f) => ({
      kind: f.kind,
      label: f.label,
      basis: f.basis,
      amountKes: f.amountKes,
    })),
    rating:
      doc.rating?.average != null && doc.rating?.count
        ? { average: doc.rating.average, count: doc.rating.count }
        : undefined,
  };
}

export async function getRegions(): Promise<RegionWithStatus[]> {
  return (await loadSnapshot()).regions;
}

export async function getRegion(slug: string): Promise<RegionWithStatus | undefined> {
  return (await getRegions()).find((r) => r.slug === slug);
}

export async function getExperiencesByRegion(regionSlug: string): Promise<Experience[]> {
  return (await loadSnapshot()).experiences.filter((e) => e.regionSlug === regionSlug);
}

export async function getExperience(regionSlug: string, slug: string): Promise<Experience | undefined> {
  return (await loadSnapshot()).experiences.find((e) => e.regionSlug === regionSlug && e.slug === slug);
}

export async function getAllExperiences(): Promise<Experience[]> {
  return (await loadSnapshot()).experiences;
}
