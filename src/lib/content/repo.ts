import { experiences, partners, regions } from "./seed";
import type { Experience, RegionWithStatus } from "./types";

// Read API for content. Today it reads seed data; later it calls Payload's local API.
// Keep every page and component going through these functions.

/** A region goes live once it has at least this many signed partners (PRD MAP-3). */
export const GO_LIVE_PARTNER_THRESHOLD = 5;

function signedPartnerCount(regionSlug: string): number {
  return partners.filter((p) => p.regionSlug === regionSlug && p.contractSigned).length;
}

export function getRegions(): RegionWithStatus[] {
  return regions.map((region) => {
    const partnerCount = signedPartnerCount(region.slug);
    return {
      ...region,
      partnerCount,
      status: partnerCount >= GO_LIVE_PARTNER_THRESHOLD ? "live" : "coming_soon",
    };
  });
}

export function getRegion(slug: string): RegionWithStatus | undefined {
  return getRegions().find((r) => r.slug === slug);
}

export function getExperiencesByRegion(regionSlug: string): Experience[] {
  return experiences.filter((e) => e.regionSlug === regionSlug);
}

export function getExperience(regionSlug: string, slug: string): Experience | undefined {
  return experiences.find((e) => e.regionSlug === regionSlug && e.slug === slug);
}

export function getAllExperiences(): Experience[] {
  return experiences;
}
