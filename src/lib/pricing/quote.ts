import type { Experience, Fee, PriceRule } from "@/lib/content/types";
import { formatKes } from "@/lib/money";

// The one pricing function. The "from" price on cards and the breakdown at booking
// both come from here, so they can never disagree.

export type QuoteLine = { label: string; detail: string; amountKes: number };

export type Quote = {
  lines: QuoteLine[];
  totalKes: number;
  perPersonKes: number;
  seasonLabel?: string;
};

export class QuoteError extends Error {}

/** "MM-DD" for a date, read in UTC so server and browser agree. */
function monthDay(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function inSeason(rule: PriceRule, date: Date): boolean {
  if (!rule.season) return true;
  const md = monthDay(date);
  const { from, to } = rule.season;
  // A season can wrap the year end, e.g. "12-15" to "01-05".
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

function fitsGroup(rule: PriceRule, partySize: number): boolean {
  return (rule.minGroup ?? 1) <= partySize && partySize <= (rule.maxGroup ?? Infinity);
}

function ruleTotal(rule: PriceRule, partySize: number): number {
  return rule.basis === "per_person" ? rule.amountKes * partySize : rule.amountKes;
}

function feeTotal(fee: Fee, partySize: number): number {
  return fee.basis === "per_person" ? fee.amountKes * partySize : fee.amountKes;
}

/** Picks the rule that applies: seasonal rules beat all-year ones, then the cheapest. */
function pickRule(experience: Experience, date: Date, partySize: number): PriceRule {
  const valid = experience.priceRules.filter(
    (r) => inSeason(r, date) && fitsGroup(r, partySize),
  );
  if (valid.length === 0) {
    throw new QuoteError(`No price for a party of ${partySize} on ${date.toISOString().slice(0, 10)}`);
  }
  const seasonal = valid.filter((r) => r.season);
  const pool = seasonal.length > 0 ? seasonal : valid;
  return pool.reduce((best, r) =>
    ruleTotal(r, partySize) < ruleTotal(best, partySize) ? r : best,
  );
}

export function quote(experience: Experience, date: Date, partySize: number): Quote {
  if (!Number.isInteger(partySize) || partySize < 1) {
    throw new QuoteError("Party size must be a whole number of at least 1");
  }
  const rule = pickRule(experience, date, partySize);
  const base: QuoteLine = {
    label: rule.season ? `Experience (${rule.season.label})` : "Experience",
    detail: rule.basis === "per_person" ? `${partySize} × ${formatKes(rule.amountKes)}` : "per group",
    amountKes: ruleTotal(rule, partySize),
  };
  const fees: QuoteLine[] = experience.fees.map((fee) => ({
    label: fee.label,
    detail: fee.basis === "per_person" ? `${partySize} × ${formatKes(fee.amountKes)}` : "per group",
    amountKes: feeTotal(fee, partySize),
  }));
  const lines = [base, ...fees];
  const totalKes = lines.reduce((sum, l) => sum + l.amountKes, 0);
  return {
    lines,
    totalKes,
    perPersonKes: Math.ceil(totalKes / partySize),
    seasonLabel: rule.season?.label,
  };
}

/**
 * The all-in "from" price per person shown on cards: the lowest per-person total
 * across party sizes 1 to 6 and every season.
 */
export function fromPricePerPerson(experience: Experience): number {
  const sampleDates = experience.priceRules.map((r) =>
    r.season ? new Date(`2026-${r.season.from}T00:00:00Z`) : null,
  );
  const dates = [new Date("2026-03-01T00:00:00Z"), ...sampleDates.filter((d) => d !== null)];
  let best = Infinity;
  for (const date of dates) {
    for (let party = 1; party <= 6; party++) {
      try {
        best = Math.min(best, quote(experience, date, party).perPersonKes);
      } catch (e) {
        if (!(e instanceof QuoteError)) throw e;
      }
    }
  }
  if (best === Infinity) throw new QuoteError(`No valid price for ${experience.slug}`);
  return best;
}
