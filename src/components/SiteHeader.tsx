import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-ink/10 bg-sand">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl">
          Safarinet
        </Link>
        <Link href="/explore" className="text-sm text-ink/70 hover:text-ink">
          Back to the map
        </Link>
      </div>
    </header>
  );
}
