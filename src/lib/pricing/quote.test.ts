import { describe, expect, it } from "vitest";
import type { Experience } from "@/lib/content/types";
import { fromPricePerPerson, quote, QuoteError } from "./quote";

const base: Experience = {
  slug: "test",
  regionSlug: "test",
  partnerId: "p",
  type: "game_drive",
  title: "Test",
  summary: "",
  description: "",
  location: { lat: 0, lng: 0 },
  durationHours: 1,
  priceRules: [{ basis: "per_person", amountKes: 1000 }],
  fees: [],
};

const march = new Date("2026-03-10T00:00:00Z");
const august = new Date("2026-08-10T00:00:00Z");

describe("quote", () => {
  it("multiplies per-person prices by party size", () => {
    expect(quote(base, march, 3).totalKes).toBe(3000);
  });

  it("adds per-person and per-group fees", () => {
    const exp: Experience = {
      ...base,
      fees: [
        { kind: "park_kws", label: "Park", basis: "per_person", amountKes: 500 },
        { kind: "vehicle", label: "Vehicle", basis: "per_group", amountKes: 4000 },
      ],
    };
    const q = quote(exp, march, 2);
    expect(q.lines.map((l) => l.amountKes)).toEqual([2000, 1000, 4000]);
    expect(q.totalKes).toBe(7000);
    expect(q.perPersonKes).toBe(3500);
  });

  it("uses the seasonal rule inside its season and the all-year rule outside", () => {
    const exp: Experience = {
      ...base,
      priceRules: [
        { basis: "per_person", amountKes: 1000 },
        { basis: "per_person", amountKes: 1500, season: { from: "07-01", to: "10-31", label: "Peak" } },
      ],
    };
    expect(quote(exp, march, 1).totalKes).toBe(1000);
    const peak = quote(exp, august, 1);
    expect(peak.totalKes).toBe(1500);
    expect(peak.seasonLabel).toBe("Peak");
  });

  it("handles seasons that wrap the year end", () => {
    const exp: Experience = {
      ...base,
      priceRules: [
        { basis: "per_person", amountKes: 1000 },
        { basis: "per_person", amountKes: 2000, season: { from: "12-15", to: "01-05", label: "Holidays" } },
      ],
    };
    expect(quote(exp, new Date("2026-12-24T00:00:00Z"), 1).totalKes).toBe(2000);
    expect(quote(exp, new Date("2027-01-03T00:00:00Z"), 1).totalKes).toBe(2000);
    expect(quote(exp, new Date("2027-01-06T00:00:00Z"), 1).totalKes).toBe(1000);
  });

  it("charges per-group prices once", () => {
    const exp: Experience = { ...base, priceRules: [{ basis: "per_group", amountKes: 6000, maxGroup: 6 }] };
    expect(quote(exp, march, 4).totalKes).toBe(6000);
    expect(quote(exp, march, 4).perPersonKes).toBe(1500);
  });

  it("rejects party sizes outside every rule", () => {
    const exp: Experience = { ...base, priceRules: [{ basis: "per_group", amountKes: 6000, maxGroup: 6 }] };
    expect(() => quote(exp, march, 7)).toThrow(QuoteError);
  });

  it("rejects invalid party sizes", () => {
    expect(() => quote(base, march, 0)).toThrow(QuoteError);
    expect(() => quote(base, march, 1.5)).toThrow(QuoteError);
  });
});

describe("fromPricePerPerson", () => {
  it("finds the cheapest per-person total across party sizes", () => {
    const exp: Experience = {
      ...base,
      fees: [{ kind: "vehicle", label: "Vehicle", basis: "per_group", amountKes: 6000 }],
    };
    // 1000 per person + 6000 split across 6 people = 2000.
    expect(fromPricePerPerson(exp)).toBe(2000);
  });
});
