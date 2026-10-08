import Link from "next/link";
import { ContourBackdrop } from "@/components/landing/ContourBackdrop";

/** Split screen: the brand on a dark contour panel, the form on sand. Stacks on phones. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-night text-sand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <ContourBackdrop />
        <Link href="/" className="relative font-display text-2xl">
          Safarinet
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight">Fly over Kenya before you land in it.</p>
          <p className="mt-4 text-sand/75">
            One free account opens the 3D map, every region we cover, and all-in prices from local operators.
          </p>
        </div>
        <p className="relative text-sm text-sand/60">Card or M-Pesa · Prices in KES and USD</p>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <Link href="/" className="font-display text-2xl lg:hidden">
          Safarinet
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
