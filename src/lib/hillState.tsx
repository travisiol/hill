"use client";

/*
 * One place that answers "what is happening on the hill right now", so the
 * model, the standings, the pot and the button can never disagree.
 *
 * `preview` swaps the whole answer at once — there is deliberately no mode
 * where the arcs are an example and the pot is real.
 *
 * The clock lives here too. It is one interval for the whole page rather than
 * one per component: a countdown, a ring and three durations ticking on three
 * separate timers drift apart within a minute, and the page would be showing
 * four slightly different times for one hour.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EPOCH_SECONDS,
  epochAt,
  epochStart,
  leaderOf,
  slicesFor,
  standingsFor,
  type CrownChange,
  type Standing,
} from "@/lib/crown";
import { crownIsLive } from "@/lib/site-config";
import { previewChanges, previewPotAt } from "@/lib/preview";

interface HillState {
  /** Unix seconds. Null until the first tick, so server and client agree. */
  now: number | null;
  preview: boolean;
  setPreview: (on: boolean) => void;
  /** True when these figures came off the chain. False in preview and before launch. */
  live: boolean;
  changes: CrownChange[];
  standings: Standing[];
  leader: Standing | null;
  king: CrownChange | null;
  /** Seconds left in the hour. */
  remaining: number;
  /** How far through the hour, 0 → 1. */
  progress: number;
  epoch: number;
  /** The hour's pot in wei. Zero until fees are actually collected. */
  pot: bigint;
}

const Ctx = createContext<HillState | null>(null);

export function HillStateProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState(false);

  /*
   * Nothing is seeded synchronously. Reading Date.now() in a render body is
   * impure — React 19 lints it — and seeding it from an effect on mount trips
   * the set-state-in-effect rule instead. An interval that starts empty is
   * the shape that satisfies both, and every consumer already has to handle
   * the pre-launch case, so a null first frame costs nothing.
   */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const setPreviewCb = useCallback((on: boolean) => setPreview(on), []);

  const value = useMemo<HillState>(() => {
    const t = now ?? 0;
    const epoch = epochAt(t);
    const start = epochStart(epoch);

    /*
     * Chain reads land here when the crown module exists. Until then the only
     * honest history is an empty one, and the site says "awaiting launch"
     * rather than drawing a zero as if it had been measured.
     */
    const changes: CrownChange[] = preview ? previewChanges(t) : [];

    const slices = slicesFor(changes, t);
    const standings = now === null ? [] : standingsFor(slices, epoch);

    return {
      now,
      preview,
      setPreview: setPreviewCb,
      live: !preview && crownIsLive,
      changes,
      standings,
      leader: now === null ? null : leaderOf(slices, epoch),
      king: changes.length > 0 ? changes[changes.length - 1] : null,
      remaining: now === null ? EPOCH_SECONDS : Math.max(0, start + EPOCH_SECONDS - t),
      progress: now === null ? 0 : Math.min(1, Math.max(0, (t - start) / EPOCH_SECONDS)),
      epoch,
      pot: preview && now !== null ? previewPotAt(t) : 0n,
    };
  }, [now, preview, setPreviewCb]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHill(): HillState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHill must be used inside HillStateProvider");
  return ctx;
}
