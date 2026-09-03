"use client";

/*
 * A rail, not a bar. It floats a few pixels off the top on a plate with a
 * hairline edge, so it reads as another milled part lying on the bench rather
 * than a chrome band bolted across the page.
 *
 * The countdown lives here as well as in the hero, and that is on purpose:
 * scroll past the model and the one number that never stops mattering — how
 * long this hour has left — stays in the corner of the eye.
 */

import { clsx } from "clsx";
import { Mark } from "@/components/Mark";
import { WalletConnect } from "@/components/WalletConnect";
import { useHill } from "@/lib/hillState";
import { formatClock } from "@/lib/crown";
import { nav, siteConfig } from "@/lib/site-config";

export function Navbar() {
  const { remaining, now } = useHill();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div
        className={clsx(
          "mx-auto flex h-14 max-w-6xl items-center gap-4 rounded-full px-4 sm:px-5",
          "border border-rule bg-[color-mix(in_srgb,var(--field-lit)_82%,transparent)] backdrop-blur-md",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-24px_rgba(16,19,23,0.6)]",
        )}
      >
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <Mark />
          <span className="type-label text-ink">{siteConfig.name}</span>
        </a>

        <nav className="ml-2 hidden items-center gap-5 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="type-label text-ink-mute transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span
            className="hidden items-center gap-2 sm:flex"
            title="Time left in the current hour (UTC)"
          >
            <span className="type-label text-ink-mute">Hour ends</span>
            <span className="type-data tnum text-ink">
              {now === null ? "--:--" : formatClock(remaining)}
            </span>
          </span>
          <WalletConnect showHint={false} className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
