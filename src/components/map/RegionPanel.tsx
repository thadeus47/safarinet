"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";
import { ExperienceMedia } from "@/components/cards/ExperienceMedia";
import { formatKes, formatUsd } from "@/lib/money";
import type { DestinationCard, MapRegion } from "./types";

gsap.registerPlugin(useGSAP);

/**
 * The region hub over the map: a side sheet on desktop, a bottom sheet on phones.
 * It lists the region's places; choosing one (here or on the map) swaps the list for
 * that place's details.
 */
export function RegionPanel({
  region,
  cards,
  selectedPlace,
  onSelectPlace,
  onClose,
}: {
  region: MapRegion;
  cards: DestinationCard[];
  selectedPlace: DestinationCard | null;
  onSelectPlace: (id: string | null) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);

  // The panel arrives once most of the camera flight is done.
  useGSAP(
    () => {
      gsap.from(panel.current, { autoAlpha: 0, y: 40, duration: 0.6, delay: 0.9, ease: "power3.out" });
    },
    { scope: panel, dependencies: [region.slug], revertOnUpdate: true },
  );

  // Content fades in on every switch between the list and a place.
  useGSAP(
    () => {
      panel.current?.scrollTo({ top: 0 });
      gsap.from("[data-reveal]", { autoAlpha: 0, y: 14, stagger: 0.05, duration: 0.4, ease: "power2.out" });
    },
    { scope: panel, dependencies: [region.slug, selectedPlace?.id], revertOnUpdate: true },
  );

  return (
    <aside
      ref={panel}
      aria-label={selectedPlace ? selectedPlace.title : `${region.name} experiences`}
      className="absolute inset-x-0 bottom-0 max-h-[62dvh] overflow-y-auto rounded-t-3xl bg-sand p-5 text-ink shadow-2xl sm:top-32 sm:right-4 sm:bottom-4 sm:left-auto sm:max-h-none sm:w-[400px] sm:rounded-3xl"
    >
      {selectedPlace ? (
        <PlaceDetail place={selectedPlace} regionName={region.name} onBack={() => onSelectPlace(null)} />
      ) : (
        <RegionList region={region} cards={cards} onSelectPlace={onSelectPlace} onClose={onClose} />
      )}
    </aside>
  );
}

function RegionList({
  region,
  cards,
  onSelectPlace,
  onClose,
}: {
  region: MapRegion;
  cards: DestinationCard[];
  onSelectPlace: (id: string) => void;
  onClose: () => void;
}) {
  const live = region.status === "live";
  return (
    <>
      <div className="flex items-start justify-between gap-4" data-reveal>
        <div>
          <h2 className="font-display text-2xl">{region.name}</h2>
          <p className="text-sm text-ink/70">{region.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-medium hover:bg-ink/5"
        >
          All of Kenya
        </button>
      </div>

      {live ? (
        <>
          <p className="mt-4 text-xs text-ink/60" data-reveal>
            {cards.length} places on the map. Tap one to see more.
          </p>
          <ul className="mt-2 space-y-2">
            {cards.map((card) => (
              <li key={card.id} data-reveal>
                <button
                  type="button"
                  onClick={() => onSelectPlace(card.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/70 p-2.5 text-left ring-1 ring-ink/10 transition hover:bg-white hover:ring-ink/20"
                >
                  <ExperienceMedia title={card.title} typeLabel={card.typeLabel} className="h-16 w-20 shrink-0 rounded-xl" />
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wide text-acacia">{card.typeLabel}</span>
                    <span className="block truncate font-medium leading-snug">{card.title}</span>
                    <span className="mt-0.5 block text-sm">
                      From <strong>{formatKes(card.fromKes)}</strong>
                      <span className="text-ink/60"> per person</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link
            href={`/${region.slug}`}
            className="mt-5 block rounded-full border border-ink/20 px-4 py-3 text-center text-sm font-medium hover:bg-ink/5"
            data-reveal
          >
            Open the {region.name} page
          </Link>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-ink/5 p-4 text-sm" data-reveal>
          <p className="font-medium">Coming soon</p>
          <p className="mt-1 text-ink/70">
            We&apos;re signing local partners here. {region.name} opens once five are confirmed.
          </p>
        </div>
      )}
    </>
  );
}

function PlaceDetail({
  place,
  regionName,
  onBack,
}: {
  place: DestinationCard;
  regionName: string;
  onBack: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="rounded-full border border-ink/20 px-3 py-1.5 text-xs font-medium hover:bg-ink/5"
        data-reveal
      >
        ← Back to {regionName}
      </button>

      <ExperienceMedia
        title={place.title}
        typeLabel={place.typeLabel}
        className="mt-4 aspect-[16/9] w-full rounded-2xl"
      />

      <p className="mt-4 text-xs uppercase tracking-wide text-acacia" data-reveal>
        {place.typeLabel} · {place.durationHours} hours
      </p>
      <h2 className="font-display text-2xl leading-tight" data-reveal>
        {place.title}
      </h2>
      {place.rating && (
        <p className="mt-1 text-sm text-ink/70" data-reveal>
          ★ {place.rating.average.toFixed(1)} · {place.rating.count} reviews
        </p>
      )}
      <p className="mt-3" data-reveal>
        {place.summary}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm" data-reveal>
        <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-ink/10">
          <dt className="text-xs text-ink/60">From, per person</dt>
          <dd className="font-medium">{formatKes(place.fromKes)}</dd>
          <dd className="text-xs text-ink/60">{formatUsd(place.fromKes)}, all-in</dd>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-ink/10">
          <dt className="text-xs text-ink/60">Distance</dt>
          <dd className="font-medium">{Math.round(place.distanceKm)} km</dd>
          <dd className="text-xs text-ink/60">from Nairobi</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2" data-reveal>
        <Link
          href={place.bookHref}
          className="block rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-sand hover:bg-ink/90"
        >
          Request to book
        </Link>
        <Link
          href={place.href}
          className="block rounded-full border border-ink/20 px-4 py-3 text-center text-sm font-medium hover:bg-ink/5"
        >
          View full details
        </Link>
      </div>
    </>
  );
}
