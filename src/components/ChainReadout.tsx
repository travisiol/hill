"use client";

import { useEffect, useState } from "react";
import { createPublicClient, formatGwei, http } from "viem";
import { robinhoodChain } from "@/lib/chain";
import { Label } from "@/components/ui/Label";

/*
 * The one live thing on the page.
 *
 * Everything about the game is held; the chain underneath it is not, and this
 * reads it from the visitor's own browser every six seconds. It sits directly
 * above a set of standings that are all empty. That juxtaposition is
 * deliberate: the chain is real, the hill is not yet, and the page shows both
 * rather than borrowing the credibility of the first for the second.
 *
 * It says "last read", not "last block". The chain produces blocks far faster
 * than this polls, so what is a few seconds old is the reading, not the chain.
 */

const client = createPublicClient({ chain: robinhoodChain, transport: http() });

interface Reading {
  block: bigint;
  gasWei: bigint;
  at: number;
}

export function ChainReadout() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [failed, setFailed] = useState(false);
  // The age of the reading is a clock, so it ticks in an effect. Reading
  // Date.now() in the render body makes the component impure, and the number
  // would only update whenever something else happened to re-render it.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function read() {
      try {
        const [block, gasWei] = await Promise.all([
          client.getBlockNumber(),
          client.getGasPrice(),
        ]);
        if (cancelled) return;
        setReading({ block, gasWei, at: Date.now() });
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    read();
    const timer = window.setInterval(read, 6000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    // Nothing is set synchronously here: a fresh reading is genuinely zero
    // seconds old, so the fallback below is already right until the first tick.
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const age =
    reading && now !== null ? Math.max(0, Math.round((now - reading.at) / 1000)) : 0;

  const rows: { label: string; value: string; live: boolean }[] = [
    { label: "Network", value: robinhoodChain.name, live: true },
    { label: "Chain id", value: String(robinhoodChain.id), live: true },
    {
      label: "Block height",
      value: reading
        ? reading.block.toLocaleString("en-US")
        : failed
          ? "unreachable"
          : "reading…",
      live: !!reading,
    },
    {
      label: "Gas price",
      value: reading
        ? `${Number(formatGwei(reading.gasWei)).toFixed(3)} gwei`
        : failed
          ? "—"
          : "reading…",
      live: !!reading,
    },
  ];

  return (
    <div className="plate p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>Read from your browser</Label>
        <span className="type-label text-ink-mute">
          {reading ? `last read ${age}s ago` : failed ? "rpc not answering" : "connecting"}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label}>
            <Label>{row.label}</Label>
            <dd className={`type-data mt-1.5 ${row.live ? "text-ink" : "text-ink-mute"}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
