import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/BookingForm";
import { SiteHeader } from "@/components/SiteHeader";
import { getAllExperiences, getExperience, getRegion } from "@/lib/content/repo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllExperiences()
    .filter((e) => getRegion(e.regionSlug)?.status === "live")
    .map((e) => ({ region: e.regionSlug, experience: e.slug }));
}

export const metadata: Metadata = { title: "Request to book · Safarinet", robots: { index: false } };

export default async function BookPage({ params }: PageProps<"/book/[region]/[experience]">) {
  const { region: regionSlug, experience: slug } = await params;
  const region = getRegion(regionSlug);
  const experience = getExperience(regionSlug, slug);
  if (!region || region.status !== "live" || !experience) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href={`/${region.slug}/${experience.slug}`} className="text-sm text-ink/60 hover:text-ink">
          ← {experience.title}
        </Link>
        <h1 className="mt-3 font-display text-3xl">Request to book</h1>
        <p className="mt-1 text-ink/70">
          {experience.title}, {region.name}
        </p>
        <BookingForm experience={experience} />
      </main>
    </>
  );
}
