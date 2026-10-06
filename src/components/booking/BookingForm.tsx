"use client";

import { useMemo, useState } from "react";
import type { Experience } from "@/lib/content/types";
import { formatKes, formatUsd } from "@/lib/money";
import { quote, QuoteError } from "@/lib/pricing/quote";

function tomorrowIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function BookingForm({ experience }: { experience: Experience }) {
  const [date, setDate] = useState(tomorrowIso);
  const [partySize, setPartySize] = useState(2);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    try {
      return { quote: quote(experience, new Date(`${date}T00:00:00Z`), partySize) };
    } catch (e) {
      if (e instanceof QuoteError) return { error: e.message };
      throw e;
    }
  }, [experience, date, partySize]);

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Date</span>
          <input
            type="date"
            required
            min={tomorrowIso()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Guests</span>
          <input
            type="number"
            required
            min={1}
            max={20}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Full name</span>
          <input required autoComplete="name" className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2" />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">WhatsApp number (optional)</span>
          <input type="tel" autoComplete="tel" placeholder="+254…" className="mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2" />
        </label>
      </div>

      <section className="rounded-2xl bg-white/70 p-5 ring-1 ring-ink/10" aria-live="polite">
        <h2 className="font-medium">Price breakdown</h2>
        {"error" in result ? (
          <p className="mt-2 text-sm text-red-700">{result.error}</p>
        ) : (
          <>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {result.quote.lines.map((line) => (
                  <tr key={line.label} className="border-b border-ink/10 last:border-0">
                    <td className="py-2">
                      {line.label}
                      <span className="block text-xs text-ink/60">{line.detail}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatKes(line.amountKes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex items-baseline justify-between border-t border-ink/20 pt-3">
              <span className="font-medium">Total</span>
              <span className="text-right">
                <span className="font-display text-2xl tabular-nums">{formatKes(result.quote.totalKes)}</span>
                <span className="block text-xs text-ink/60">≈ {formatUsd(result.quote.totalKes)}</span>
              </span>
            </div>
          </>
        )}
      </section>

      {submitted ? (
        <p role="status" className="rounded-2xl bg-acacia/10 p-4 text-sm">
          Payments aren&apos;t connected yet. In the next build step this sends the request and takes the deposit by
          card or M-Pesa through Paystack.
        </p>
      ) : (
        <button
          type="submit"
          disabled={"error" in result}
          className="w-full rounded-full bg-ink px-4 py-3 text-sm font-medium text-sand hover:bg-ink/90 disabled:opacity-40"
        >
          Continue to deposit
        </button>
      )}
    </form>
  );
}
