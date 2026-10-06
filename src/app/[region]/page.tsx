import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationCardView } from "@/components/cards/DestinationCardView";
import { SiteHeader } from "@/components/SiteHeader";
import { getExperiencesByRegion, getRegion, getRegions } from "@/lib/content/repo";
import { toCard } from "@/lib/content/view";

export const dynamicParams = false;

export function generateStaticParams() {
  return getRegions().map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[region]">): Promise<Metadata> {
  const region = getRegion((await params).region);
  return region ? { title: `${region.name} experiences · Safarinet`, description: region.description } : {};
}

export default async function RegionPage({ params }: PageProps<"/[region]">) {
  const region = getRegion((await params).region);
  if (!region) notFound();
  const cards = region.status === "live" ? getExperiencesByRegion(region.slug).map(toCard) : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-wide text-acacia">Region</p>
        <h1 className="font-display text-4xl">{region.name}</h1>
        <p className="mt-2 max-w-2xl text-ink/70">{region.description}</p>

        {region.status === "live" ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <li key={card.href}>
                <DestinationCardView card={card} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-2xl bg-ink/5 p-6">
            <p className="font-medium">Coming soon</p>
            <p className="mt-1 text-ink/70">
              We&apos;re signing local partners in {region.name}. It opens once five are confirmed.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
