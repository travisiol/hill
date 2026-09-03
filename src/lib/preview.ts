/*
 * The worked hour.
 *
 * Nothing has been deployed, so the real answer to "who is winning" is
 * nobody, and that is what the page shows by default. But a game explained
 * only in prose is a game nobody can picture, so there is one switch that
 * fills the hour with a scripted example.
 *
 * Two rules keep this from being a lie.
 *
 * It is generated, never typed. The arcs, the standings, the seconds and the
 * payout all come out of `crown.ts` and `economics.ts` — the same functions
 * the chain path calls. An edit to the rule moves the example with it, so the
 * example cannot drift into describing a game this site does not implement.
 *
 * It is marked wherever it appears: in the canvas, on the panel, and on the
 * switch itself. There is no state where some figures are real and others are
 * the example — the switch swaps the whole answer at once.
 */

import { EPOCH_SECONDS, epochAt, epochStart, type Address, type CrownChange } from "@/lib/crown";
import { FEE_BPS, feeOn } from "@/lib/economics";

/**
 * Three wallets, and they are labelled rather than addressed everywhere it
 * matters. An invented address rendered the way a real one is rendered is the
 * one thing on a preview that a screenshot can carry off the page.
 */
export const previewWallets: { address: Address; label: string }[] = [
  { address: "0x5f0a3d9e2b7c41a86d3f5e0c9b1a4d7e28c60f13", label: "Preview wallet A" },
  { address: "0xa17c48e0b3d95f2761e8c04a9d3b57f60e21a8c4", label: "Preview wallet B" },
  { address: "0xc93e17b6a0d248f5309b7e1c46a8d05f21e9b374", label: "Preview wallet C" },
];

export function previewLabel(address: string): string | null {
  return previewWallets.find((w) => w.address.toLowerCase() === address.toLowerCase())?.label ?? null;
}

/**
 * The crown history behind the example, anchored to the hour on the visitor's
 * clock so the arcs land where the ring says they should.
 *
 * The first change deliberately sits in the previous hour: a reign that was
 * already running when the bell rang is the ordinary case, and it exercises
 * the boundary split rather than hiding it behind a tidy start at :00.
 */
export function previewChanges(now: number): CrownChange[] {
  const start = epochStart(epochAt(now));
  const [a, b, c] = previewWallets;

  const script: { holder: Address; offset: number; balance: bigint }[] = [
    // Minutes relative to the top of the current hour.
    { holder: a.address, offset: -11 * 60, balance: 4_200_000n },
    { holder: b.address, offset: 9 * 60 + 20, balance: 4_610_000n },
    { holder: a.address, offset: 11 * 60 + 5, balance: 5_050_000n },
    { holder: c.address, offset: 26 * 60 + 40, balance: 5_900_000n },
    { holder: b.address, offset: 44 * 60 + 10, balance: 6_240_000n },
    { holder: a.address, offset: 51 * 60 + 30, balance: 7_100_000n },
  ];

  return script
    .map((s) => ({ holder: s.holder, at: start + s.offset, balance: s.balance * 10n ** 18n }))
    .filter((s) => s.at <= now);
}

/**
 * The example's pot, in wei.
 *
 * Derived from a volume figure and the real fee constant rather than written
 * down, so it is exactly what the stated fee would collect on that volume and
 * cannot quietly become a more flattering number.
 */
export const previewVolumeEth = 38n * 10n ** 18n;

export function previewPot(): bigint {
  return feeOn(previewVolumeEth, FEE_BPS);
}

/** Fees arrive across the hour, not in a lump, so the pot counts up with it. */
export function previewPotAt(now: number): bigint {
  const into = now - epochStart(epochAt(now));
  const share = Math.min(1, Math.max(0, into / EPOCH_SECONDS));
  return (previewPot() * BigInt(Math.round(share * 10_000))) / 10_000n;
}
