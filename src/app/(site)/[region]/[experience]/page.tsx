import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceMedia } from "@/components/cards/ExperienceMedia";
import { SiteHeader } from "@/components/SiteHeader";
import { getAllExperiences, getExperience, getRegion, getRegions } from "@/lib/content/repo";
import { TYPE_LABELS } from "@/lib/content/view";
import { formatKes, formatUsd } from "@/lib/money";
import { fromPricePerPerson } from "@/lib/pricing/quote";

export async function generateStaticParams() {
  const regions = await getRegions();
  const live = new Set(regions.filter((r) => r.status === "live").map((r) => r.slug));
  return (await getAllExperiences())
    .filter((e) => live.has(e.regionSlug))
    .map((e) => ({ region: e.regionSlug, experience: e.slug }));
}

async function load(params: PageProps<"/[region]/[experience]">["params"]) {
  const { region: regionSlug, experience: slug } = await params;
  const [region, experience] = await Promise.all([getRegion(regionSlug), getExperience(regionSlug, slug)]);
  if (!region || region.status !== "live" || !experience) return null;
  return { region, experience };
}

export async function generateMetadata({ params }: PageProps<"/[region]/[experience]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  return {
    title: `${data.experience.title} · ${data.region.name} · Safarinet`,
    description: data.experience.summary,
  };
}

export default async function ExperiencePage({ params }: PageProps<"/[region]/[experience]">) {
  const data = await load(params);
  if (!data) notFound();
  const { region, experience } = data;
  const typeLabel = TYPE_LABELS[experience.type];
  const fromKes = fromPricePerPerson(experience);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href={`/${region.slug}`} className="text-sm text-ink/60 hover:text-ink">
          ← {region.name}
        </Link>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ExperienceMedia title={experience.title} typeLabel={typeLabel} className="aspect-[4/3] rounded-2xl sm:col-span-2 sm:row-span-2 sm:aspect-auto" />
          <ExperienceMedia title={experience.title} typeLabel={typeLabel} className="hidden aspect-[4/3] rounded-2xl sm:block" />
          <ExperienceMedia title={experience.title} typeLabel={typeLabel} className="hidden aspect-[4/3] rounded-2xl sm:block" />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <article>
            <p className="text-sm uppercase tracking-wide text-acacia">
              {typeLabel} · {experience.durationHours} hours
            </p>
            <h1 className="font-display text-4xl">{experience.title}</h1>
            {experience.rating && (
              <p className="mt-2 text-sm text-ink/70">
                ★ {experience.rating.average.toFixed(1)} · {experience.rating.count} reviews
              </p>
            )}
            <p className="mt-4 text-lg">{experience.summary}</p>
            <p className="mt-3 text-ink/80">{experience.description}</p>

            {experience.fees.length > 0 && (
              <section className="mt-8">
                <h2 className="font-medium">Included in the all-in price</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink/80">
                  {experience.fees.map((fee) => (
                    <li key={fee.label}>
                      {fee.label}: {formatKes(fee.amountKes)} {fee.basis === "per_person" ? "per person" : "per group"}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          <aside className="h-fit rounded-3xl bg-white/70 p-5 ring-1 ring-ink/10 lg:sticky lg:top-6">
            <p className="text-sm text-ink/70">From</p>
            <p className="font-display text-3xl">{formatKes(fromKes)}</p>
            <p className="text-sm text-ink/60">{formatUsd(fromKes)} per person, all-in</p>
            <Link
              href={`/book/${region.slug}/${experience.slug}`}
              className="mt-5 block rounded-full bg-ink px-4 py-3 text-center text-sm font-medium text-sand hover:bg-ink/90"
            >
              Request to book
            </Link>
            <p className="mt-3 text-xs text-ink/60">
              Pay a deposit by card or M-Pesa. The partner confirms within 24 hours, or you get a full refund.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
