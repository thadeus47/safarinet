import Link from "next/link";
import { ExperienceMedia } from "@/components/cards/ExperienceMedia";
import { ContourBackdrop } from "@/components/landing/ContourBackdrop";
import {
  ArrowRightIcon,
  MapIcon,
  ShieldIcon,
  TicketIcon,
  UserPlusIcon,
  VolumeIcon,
  WalletIcon,
} from "@/components/landing/icons";
import { KenyaPreview } from "@/components/landing/KenyaPreview";
import { getMapData } from "@/lib/content/view";
import { formatKes } from "@/lib/money";

const primaryButton =
  "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-acacia px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-[#a9541a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acacia";
const ghostButton =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full px-6 py-3 font-medium ring-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acacia";

const STEPS = [
  {
    icon: UserPlusIcon,
    title: "Create a free account",
    body: "Your name, email and a password. That's all, and the map opens straight away.",
  },
  {
    icon: MapIcon,
    title: "Fly over Kenya",
    body: "Tap a region to swoop in. Every game drive, walk and visit sits on the map where it really happens.",
  },
  {
    icon: TicketIcon,
    title: "Request to book",
    body: "Pick a date and group size and see the full price, park fees included, before you commit.",
  },
];

const PROMISES = [
  { icon: WalletIcon, title: "All-in prices", body: "Shown in KES and USD, with park and conservancy fees included." },
  { icon: ShieldIcon, title: "Local, vetted operators", body: "Every partner is signed and checked by our team in Kenya." },
  { icon: VolumeIcon, title: "Hear where you're going", body: "Wind on the plains, waves at the coast. Each region has its own sound." },
];

/** The public front door. The map itself is behind sign-in, at /explore. */
export default async function Landing() {
  const { regions, cardsByRegion } = await getMapData();
  const cards = Object.values(cardsByRegion).flat();
  const live = regions.filter((r) => r.status === "live");
  const featured = [...cards].sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0)).slice(0, 3);
  const lowest = cards.length ? Math.min(...cards.map((c) => c.fromKes)) : null;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-sand px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-4 top-4 z-40 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-night/75 py-2 pr-2 pl-5 text-sand shadow-lg ring-1 ring-sand/10 backdrop-blur-md">
        <Link href="/" className="font-display text-xl">
          Safarinet
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          <a href="#how" className="hidden rounded-full px-3 py-2 text-sand/80 transition-colors duration-200 hover:text-sand md:block">
            How it works
          </a>
          <a href="#regions" className="hidden rounded-full px-3 py-2 text-sand/80 transition-colors duration-200 hover:text-sand md:block">
            Regions
          </a>
          <Link href="/signin" className="rounded-full px-3 py-2 font-medium transition-colors duration-200 hover:bg-sand/10">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-acacia px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-[#a9541a]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden bg-night text-sand">
          <ContourBackdrop />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-32 pb-20 sm:px-6 lg:min-h-dvh lg:grid-cols-[1.05fr_1fr] lg:pt-28">
            <div className="motion-safe:animate-[rise_0.7s_ease-out_both]">
              <p className="text-sm font-medium tracking-[0.2em] text-acacia uppercase">Kenya, in 3D</p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">
                See the safari before you book it.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand/80">
                Fly over a 3D map of Kenya, from the Mara to the coast. Find game drives, guided walks and cultural visits
                run by local operators, with the full price up front.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={primaryButton}>
                  Create a free account
                  <ArrowRightIcon className="size-5" />
                </Link>
                <Link href="/signin" className={`${ghostButton} text-sand ring-sand/30 hover:bg-sand/10`}>
                  I have an account
                </Link>
              </div>
              <p className="mt-4 text-sm text-sand/60">Free to explore. Works on phones too, with a lighter map.</p>
            </div>
            <div className="motion-safe:animate-[rise_0.9s_0.15s_ease-out_both]">
              <KenyaPreview regions={regions} />
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section aria-label="Safarinet at a glance" className="border-b border-ink/10 bg-sand">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
            <Stat value={String(live.length)} label={live.length === 1 ? "region open now" : "regions open now"} />
            <Stat value={String(cards.length)} label="experiences on the map" />
            <Stat value={lowest == null ? "–" : formatKes(lowest)} label="lowest price per person" />
            <Stat value="Card · M-Pesa" label="ways to pay" />
          </dl>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 bg-sand">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-2xl font-display text-4xl leading-tight">From the sofa to the savannah in three steps.</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-3xl bg-white/70 p-6 ring-1 ring-ink/10">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-leaf text-sand">
                      <step.icon />
                    </span>
                    <span className="text-sm font-medium text-ink/60">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink/75">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Regions */}
        <section id="regions" className="scroll-mt-24 bg-[#efe5d0]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl leading-tight">Where you can go</h2>
                <p className="mt-2 max-w-xl text-ink/75">
                  A region opens once five local partners have signed on. More are on the way.
                </p>
              </div>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((r) => {
                const count = cardsByRegion[r.slug]?.length ?? 0;
                const isLive = r.status === "live";
                return (
                  <li key={r.slug} className="flex flex-col rounded-3xl bg-sand p-6 ring-1 ring-ink/10">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-2xl">{r.name}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${isLive ? "bg-leaf text-sand" : "bg-ink/10 text-ink/70"}`}
                      >
                        {isLive ? "Open" : "Coming soon"}
                      </span>
                    </div>
                    <p className="mt-2 flex-1 text-ink/75">{r.tagline}</p>
                    <p className="mt-4 text-sm text-ink/60">
                      {isLive ? `${count} ${count === 1 ? "experience" : "experiences"}` : "Signing partners now"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="bg-sand">
            <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
              <h2 className="font-display text-4xl leading-tight">Travellers&apos; favourites</h2>
              <p className="mt-2 text-ink/75">The highest-rated experiences on the map right now.</p>
              <ul className="mt-10 grid gap-6 md:grid-cols-3">
                {featured.map((card) => (
                  <li key={card.id}>
                    <Link
                      href={card.href}
                      className="group block cursor-pointer overflow-hidden rounded-3xl bg-white/70 ring-1 ring-ink/10 transition-shadow duration-200 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acacia"
                    >
                      <ExperienceMedia title={card.title} typeLabel={card.typeLabel} className="aspect-[4/3] w-full" />
                      <div className="p-5">
                        <p className="text-xs font-medium tracking-wide text-acacia uppercase">{card.typeLabel}</p>
                        <h3 className="mt-1 text-lg leading-snug font-semibold group-hover:underline group-hover:underline-offset-4">
                          {card.title}
                        </h3>
                        <p className="mt-3 flex items-center justify-between text-sm">
                          <span>
                            From <strong>{formatKes(card.fromKes)}</strong>
                          </span>
                          {card.rating && (
                            <span className="text-ink/70">
                              {card.rating.average.toFixed(1)} / 5 · {card.rating.count} reviews
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Promises */}
        <section className="bg-sand">
          <ul className="mx-auto grid max-w-6xl gap-8 border-t border-ink/10 px-4 py-16 sm:px-6 md:grid-cols-3">
            {PROMISES.map((p) => (
              <li key={p.title} className="flex gap-4">
                <p.icon className="size-6 shrink-0 text-acacia" />
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 text-ink/75">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing call to action */}
        <section className="relative overflow-hidden bg-night text-sand">
          <ContourBackdrop />
          <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">Your next trip starts on the map.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-sand/80">
              Create a free account to open it. No card needed until you book.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className={primaryButton}>
                Create a free account
                <ArrowRightIcon className="size-5" />
              </Link>
              <Link href="/signin" className={`${ghostButton} text-sand ring-sand/30 hover:bg-sand/10`}>
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-night text-sand/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-sand/10 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
          <p>
            <span className="font-display text-base text-sand">Safarinet</span> · Explore Kenya in 3D
          </p>
          <p>Prices in KES and USD · Pay by card or M-Pesa</p>
        </div>
      </footer>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-3xl">{value}</dd>
      <dd className="mt-1 text-sm text-ink/70">{label}</dd>
    </div>
  );
}
