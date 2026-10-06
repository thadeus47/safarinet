import Link from "next/link";
import type { DestinationCard } from "@/components/map/types";
import { formatKes, formatUsd } from "@/lib/money";
import { ExperienceMedia } from "./ExperienceMedia";

export function DestinationCardView({ card, compact = false }: { card: DestinationCard; compact?: boolean }) {
  return (
    <Link
      href={card.href}
      className={`group flex gap-3 rounded-2xl bg-white/70 p-2.5 ring-1 ring-ink/10 transition hover:bg-white hover:ring-ink/20 ${
        compact ? "items-center" : "flex-col p-3"
      }`}
    >
      <ExperienceMedia
        title={card.title}
        typeLabel={card.typeLabel}
        className={compact ? "h-20 w-24 shrink-0 rounded-xl" : "aspect-[4/3] w-full rounded-xl"}
      />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-acacia">{card.typeLabel}</p>
        <h3 className="truncate font-medium leading-snug">{card.title}</h3>
        {!compact && <p className="mt-1 text-sm text-ink/70">{card.summary}</p>}
        <p className="mt-1 text-xs text-ink/60">{Math.round(card.distanceKm)} km from Nairobi</p>
        <p className="mt-1 text-sm">
          From <strong>{formatKes(card.fromKes)}</strong>{" "}
          <span className="text-ink/60">({formatUsd(card.fromKes)})</span>
          <span className="text-ink/60"> per person</span>
        </p>
      </div>
    </Link>
  );
}
