/*
 * The crown.
 *
 * One tile. Whoever wore the crown longest during an hour takes that hour's
 * fees, all of them. This file is the rule, written once, so the contract
 * call, the clock on screen and the worked example can never disagree about
 * who is winning.
 *
 * Three decisions live here, and each one is a decision, not a default.
 *
 * 1. THE HOUR IS WALL-CLOCK, NOT ROLLING. Epochs are aligned to the UTC hour:
 *    epoch n runs from n*3600 to (n+1)*3600. A rolling hour ("the last 3600
 *    seconds") has no settlement moment, so there is never a pot to win and
 *    nothing to watch. An aligned hour gives the game a horn.
 *
 * 2. THE POT GOES TO THE LONGEST REIGN, NOT TO WHOEVER IS ON TOP AT THE BELL.
 *    A closing snapshot is one sentence shorter to explain and it ruins the
 *    game: you buy at 59:58, collect an hour of other people's fees, and sell.
 *    Reign time cannot be bought at the bell — a one-second reign scores one
 *    second — so the only way to win an hour here is to actually hold the top
 *    through it. This is also the literal reading of "holds the most for an
 *    hour".
 *
 * 3. THE CROWN MOVES ON A CLAIM, NOT ON EVERY TRANSFER. A token cannot find
 *    the second-largest holder without an index of every holder, which is not
 *    something a transfer can afford to walk. So the crown is taken, never
 *    handed over: anyone whose balance is strictly greater than the king's can
 *    call claim() and wear it from that second. A king who sells out stays
 *    crowned — and keeps banking seconds — until somebody takes it, which is
 *    an inconvenience with an obvious cure, since taking it is what pays.
 *    `deposed()` below is what the interface uses to say so out loud rather
 *    than pretending the standings are self-maintaining.
 */

export const EPOCH_SECONDS = 3600;

export type Address = `0x${string}`;

/** The epoch an instant falls in. Seconds since the Unix epoch, UTC. */
export function epochAt(unixSeconds: number): number {
  return Math.floor(unixSeconds / EPOCH_SECONDS);
}

/** First second of an epoch. */
export function epochStart(epoch: number): number {
  return epoch * EPOCH_SECONDS;
}

/** First second of the next epoch — the bell. */
export function epochEnd(epoch: number): number {
  return (epoch + 1) * EPOCH_SECONDS;
}

/** How far into its hour an instant sits, 0 → 1. */
export function epochProgress(unixSeconds: number): number {
  const into = unixSeconds - epochStart(epochAt(unixSeconds));
  return Math.min(1, Math.max(0, into / EPOCH_SECONDS));
}

// ---- reigns -------------------------------------------------------------

/**
 * One crown change, as the contract emits it: from this second on, this
 * address wears it. A reign runs until the next change, or until now.
 */
export interface CrownChange {
  holder: Address;
  /** Unix seconds. */
  at: number;
  /** The balance that took the crown, in token base units. */
  balance?: bigint;
}

/**
 * A stretch of one reign inside one hour. Reigns cross the bell all the time —
 * a king crowned at 10:47 who holds until 11:20 has thirty-three minutes in
 * one hour and twenty in the next, and gets judged separately in each. Every
 * slice here is clipped to a single epoch, which is the whole reason this type
 * exists.
 */
export interface ReignSlice {
  holder: Address;
  epoch: number;
  /** Unix seconds, inclusive. */
  from: number;
  /** Unix seconds, exclusive. */
  to: number;
}

export function sliceSeconds(slice: ReignSlice): number {
  return Math.max(0, slice.to - slice.from);
}

/**
 * Cut a list of crown changes into per-hour slices, up to `now`.
 *
 * Changes must be sorted ascending by `at`; the caller gets them that way from
 * a log query. The last reign is left open and clipped at `now`, so the
 * standings include the reign in progress rather than only settled ones — the
 * seconds the current king is banking right now are the most interesting
 * number on the page.
 */
export function slicesFor(changes: readonly CrownChange[], now: number): ReignSlice[] {
  const slices: ReignSlice[] = [];

  for (let i = 0; i < changes.length; i += 1) {
    const change = changes[i];
    const next = changes[i + 1];
    const start = change.at;
    const end = Math.min(next ? next.at : now, now);
    if (end <= start) continue;

    // Walk the reign hour by hour, emitting one slice per hour it touches.
    let cursor = start;
    while (cursor < end) {
      const epoch = epochAt(cursor);
      const boundary = Math.min(epochEnd(epoch), end);
      slices.push({ holder: change.holder, epoch, from: cursor, to: boundary });
      cursor = boundary;
    }
  }

  return slices;
}

/** Seconds worn per address inside one hour, biggest first. */
export interface Standing {
  holder: Address;
  seconds: number;
  /** Share of the hour, 0 → 1. */
  share: number;
}

/**
 * The standings for one hour.
 *
 * Ties keep the incumbent: `>` and not `>=`, matching a contract that only
 * writes storage on a strict improvement. Two addresses with the same total
 * are ordered by who reached it first, which is the order they arrive in.
 */
export function standingsFor(slices: readonly ReignSlice[], epoch: number): Standing[] {
  const totals = new Map<Address, number>();
  const firstSeen = new Map<Address, number>();

  for (const slice of slices) {
    if (slice.epoch !== epoch) continue;
    const seconds = sliceSeconds(slice);
    if (seconds <= 0) continue;
    totals.set(slice.holder, (totals.get(slice.holder) ?? 0) + seconds);
    if (!firstSeen.has(slice.holder)) firstSeen.set(slice.holder, slice.from);
  }

  return [...totals.entries()]
    .map(([holder, seconds]) => ({
      holder,
      seconds,
      share: seconds / EPOCH_SECONDS,
    }))
    .sort((a, b) =>
      b.seconds !== a.seconds
        ? b.seconds - a.seconds
        : (firstSeen.get(a.holder) ?? 0) - (firstSeen.get(b.holder) ?? 0),
    );
}

/** Who is winning that hour, or null if nobody wore the crown in it. */
export function leaderOf(slices: readonly ReignSlice[], epoch: number): Standing | null {
  return standingsFor(slices, epoch)[0] ?? null;
}

/** The address wearing the crown right now, if anyone ever took it. */
export function currentKing(changes: readonly CrownChange[]): CrownChange | null {
  return changes.length > 0 ? changes[changes.length - 1] : null;
}

/**
 * Is the crowned address no longer the largest holder?
 *
 * True means the standings are stale by the rule the contract enforces on the
 * next claim, and the page says so instead of letting a sold-out king look
 * like a leader. Nothing about this is automatic on chain — see the header.
 */
export function deposed(king: bigint, challenger: bigint): boolean {
  return challenger > king;
}

/**
 * The margin a challenger needs. Strictly greater, in base units — no
 * percentage cushion.
 *
 * A cushion was considered and dropped: it would let a king who is 0.4% ahead
 * sit unchallengeable for the rest of the hour, which is a moat, and the whole
 * pitch is that anyone can take the top by buying more. The cost of not having
 * one is that two whales one wei apart can trade the crown back and forth, and
 * they pay gas each time to do it. That is a bad trade for them and a fine one
 * for everybody watching.
 */
export function claimable(kingBalance: bigint, myBalance: bigint): boolean {
  return myBalance > kingBalance;
}

// ---- formatting ---------------------------------------------------------

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest}s`;
  return `${m}m ${String(rest).padStart(2, "0")}s`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** UTC label for an hour, e.g. "14:00–15:00 UTC". */
export function epochLabel(epoch: number): string {
  const start = new Date(epochStart(epoch) * 1000);
  const end = new Date(epochEnd(epoch) * 1000);
  const hh = (d: Date) => String(d.getUTCHours()).padStart(2, "0");
  return `${hh(start)}:00–${hh(end)}:00 UTC`;
}
