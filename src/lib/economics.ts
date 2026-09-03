/*
 * The pot.
 *
 * Every trade in the token pays a fee. The fee goes into the hour it was paid in,
 * and at the bell the whole hour goes to whoever wore the crown longest. That
 * is the entire economy and it fits in one paragraph on purpose.
 *
 * FEE: 100 bps — 1% — on both sides of a trade. Symmetric because a
 * buy-only fee makes the crown cheap to take and free to abandon, and the
 * whole game is that leaving the top should cost you something.
 *
 * PROTOCOL CUT: zero. Not "almost none", zero. The front page says the king
 * takes 100% of the hour and that has to be literally true, otherwise it is a
 * number with a footnote and nobody trusts the rest of the page either. There
 * is no treasury address in this file because there is no treasury line. How
 * this project funds itself, if it ever does, is one of the open questions in
 * the README rather than a slice quietly taken here.
 *
 * ROUNDING: integer arithmetic end to end, and there is nothing to round. One
 * winner takes one pot, so there is no split to leave dust in.
 *
 * DEAD HOURS ROLL. An hour in which nobody ever wore the crown has no winner,
 * and its pot is added to the next hour instead of being stranded or swept.
 * That makes a quiet hour into a bigger prize, which is the correct incentive
 * — the pot should be loudest when the hill is empty.
 *
 * POTS DO NOT EXPIRE. A won hour stays claimable forever. An expiry is a
 * mechanism for money to come back to whoever wrote the contract, and there is
 * nobody here for it to come back to.
 */

export const BPS = 10_000n;

/** The trading fee, in basis points, charged on each side. */
export const FEE_BPS = 100n;

/** The king's share of the hour, in basis points. All of it. */
export const KING_BPS = 10_000n;

/** The protocol's share. Stated as a constant so it can be read, not assumed. */
export const PROTOCOL_BPS = 0n;

if (KING_BPS + PROTOCOL_BPS !== BPS) {
  throw new Error("hill split must total 10000 bps");
}

/** Fee taken on a trade of `volume` base units. */
export function feeOn(volume: bigint, feeBps: bigint = FEE_BPS): bigint {
  if (volume <= 0n) return 0n;
  return (volume * feeBps) / BPS;
}

/** What the hour's winner receives from a pot. All of it, by construction. */
export function kingCut(pot: bigint): bigint {
  if (pot <= 0n) return 0n;
  return (pot * KING_BPS) / BPS;
}

/**
 * An hour's pot: the fees paid inside it, plus anything rolled in from hours
 * that ended with nobody on the hill.
 */
export function potFor(feesThisHour: bigint, rolledOver: bigint = 0n): bigint {
  return (feesThisHour > 0n ? feesThisHour : 0n) + (rolledOver > 0n ? rolledOver : 0n);
}

/**
 * Settle one hour. A winner takes the pot; an empty hour hands its pot to the
 * next one. Returns both sides so a caller can never forget the rollover.
 */
export function settle(
  pot: bigint,
  hadKing: boolean,
): { paid: bigint; rolls: bigint } {
  if (pot <= 0n) return { paid: 0n, rolls: 0n };
  return hadKing ? { paid: kingCut(pot), rolls: 0n } : { paid: 0n, rolls: pot };
}

/**
 * The worked example on the page. Volume in, pot out — so the numbers shown
 * beside the mechanic come out of the same arithmetic the mechanic uses, and
 * an edit to FEE_BPS moves the example with it.
 */
export function potFromVolume(volumeWei: bigint, feeBps: bigint = FEE_BPS): bigint {
  return feeOn(volumeWei, feeBps);
}

// ---- who cannot wear the crown -----------------------------------------

/**
 * Addresses excluded from the standings.
 *
 * This is not housekeeping, it decides whether the game works at all. A
 * liquidity pool holds more of a token than any human ever will, so an
 * unfiltered "largest holder" crown belongs to the pool from block one and
 * nobody can ever take it. Same for the token's own contract and for anything
 * burned.
 *
 * Kept as a list rather than a heuristic because guessing at contract-ness on
 * chain (checking code size, say) also excludes multisigs and smart accounts,
 * which are people.
 */
export const EXCLUDED_ROLES = [
  { role: "Liquidity pool", why: "Holds the float. Would own the crown permanently." },
  { role: "The token contract", why: "Holds fees in transit, not a position." },
  { role: "Burn address", why: "Nobody is behind it." },
] as const;

// ---- formatting ---------------------------------------------------------

export function pct(bps: bigint, digits = 2): string {
  const value = Number(bps) / 100;
  const text = value.toFixed(digits).replace(/\.?0+$/, "");
  return `${text}%`;
}

/** Wei → a short ETH string. Display only; arithmetic never leaves bigint. */
export function formatEth(wei: bigint, digits = 4): string {
  const negative = wei < 0n;
  const abs = negative ? -wei : wei;
  const whole = abs / 10n ** 18n;
  const frac = abs % 10n ** 18n;
  const fracText = frac.toString().padStart(18, "0").slice(0, digits).replace(/0+$/, "");
  const body = fracText.length > 0 ? `${whole}.${fracText}` : `${whole}`;
  return negative ? `-${body}` : body;
}

export function parseEth(value: string): bigint | null {
  const trimmed = value.trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") return null;
  const [whole = "0", frac = ""] = trimmed.split(".");
  if (frac.length > 18) return null;
  return BigInt(whole || "0") * 10n ** 18n + BigInt((frac || "0").padEnd(18, "0"));
}
