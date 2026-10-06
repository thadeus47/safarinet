"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";
import { DestinationCardView } from "@/components/cards/DestinationCardView";
import type { DestinationCard, MapRegion } from "./types";

gsap.registerPlugin(useGSAP);

/** The region hub over the map: a side sheet on desktop, a bottom sheet on phones. */
export function RegionPanel({
  region,
  cards,
  onClose,
}: {
  region: MapRegion;
  cards: DestinationCard[];
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Wait for most of the camera flight before the panel arrives.
      const tl = gsap.timeline({ delay: 0.9 });
      tl.from(panel.current, { autoAlpha: 0, y: 40, duration: 0.6, ease: "power3.out" });
      tl.from("[data-card]", { autoAlpha: 0, y: 16, stagger: 0.07, duration: 0.4, ease: "power2.out" }, "-=0.25");
    },
    { scope: panel, dependencies: [region.slug], revertOnUpdate: true },
  );

  const live = region.status === "live";

  return (
    <aside
      ref={panel}
      aria-label={`${region.name} experiences`}
      className="absolute inset-x-0 bottom-0 max-h-[62dvh] overflow-y-auto rounded-t-3xl bg-sand p-5 text-ink shadow-2xl sm:inset-y-4 sm:right-4 sm:left-auto sm:max-h-none sm:w-[400px] sm:rounded-3xl"
    >
      <div className="flex items-start justify-between gap-4">
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
          <ul className="mt-5 space-y-3">
            {cards.map((card) => (
              <li key={card.href} data-card>
                <DestinationCardView card={card} compact />
              </li>
            ))}
          </ul>
          <Link
            href={`/${region.slug}`}
            className="mt-5 block rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-sand hover:bg-ink/90"
          >
            See everything in {region.name}
          </Link>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-ink/5 p-4 text-sm" data-card>
          <p className="font-medium">Coming soon</p>
          <p className="mt-1 text-ink/70">
            We&apos;re signing local partners here. {region.name} opens once five are confirmed.
          </p>
        </div>
      )}
    </aside>
  );
}
