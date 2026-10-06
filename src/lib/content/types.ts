// Domain types. These mirror the Payload collections in docs/TECHNICAL-PLAN.md
// so the seed data can be swapped for the CMS without touching the UI.

export type LatLng = { lat: number; lng: number };

export type RegionStatus = "live" | "coming_soon";

export type Region = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  center: LatLng;
  /** Zoom used by the lite (MapLibre) map when the region is selected. */
  liteZoom: number;
};

export type Partner = {
  id: string;
  name: string;
  regionSlug: string;
  /** Partners only count toward go-live once their contract is signed. */
  contractSigned: boolean;
};

export type ExperienceType =
  | "game_drive"
  | "guided_walk"
  | "cultural_visit"
  | "day_trip"
  | "activity"
  | "stay";

export type PriceBasis = "per_person" | "per_group";

export type PriceRule = {
  basis: PriceBasis;
  amountKes: number;
  minGroup?: number;
  maxGroup?: number;
  /** Inclusive month-day range, e.g. "07-01" to "10-31". Omitted = all year. */
  season?: { from: string; to: string; label: string };
};

export type FeeKind = "vehicle" | "guide" | "conservancy" | "park_kws";

export type Fee = {
  kind: FeeKind;
  label: string;
  basis: PriceBasis;
  amountKes: number;
};

export type Experience = {
  slug: string;
  regionSlug: string;
  partnerId: string;
  type: ExperienceType;
  title: string;
  summary: string;
  description: string;
  location: LatLng;
  durationHours: number;
  priceRules: PriceRule[];
  fees: Fee[];
  rating?: { average: number; count: number };
};

export type RegionWithStatus = Region & {
  status: RegionStatus;
  partnerCount: number;
};
