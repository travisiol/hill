"use client";

/*
 * The rule, and the argument for it.
 *
 * The three steps are the easy half. The half that matters is the diagram
 * underneath: the same hour, settled two ways. Under a closing snapshot the
 * wallet that arrived with five minutes left takes the whole pot; under the
 * rule this contract actually implements, the wallet that held for thirty-nine
 * minutes does.
 *
 * That comparison is here because it is the first thing anyone who has been
 * burned before will ask, and answering it with a picture before they ask is
 * worth more than any amount of assurance. It also commits the project in
 * public to the harder of the two rules, which is the point.
 */

import { useState } from "react";
import { clsx } from "clsx";
import { Label } from "@/components/ui/Label";
import { EPOCH_SECONDS, formatDuration } from "@/lib/crown";
import { FEE_BPS, formatEth, parseEth, pct, potFromVolume } from "@/lib/economics";

const steps = [
  {
    n: "01",
    title: "Buy more than whoever is standing there",
    body: "There is one tile and one balance to beat: the current king's. Strictly more, no cushion, no allowlist, no cooldown.",
  },
  {
    n: "02",
    title: "Take the crown, and the clock starts",
    body: "The crown does not move on its own — you take it in one call. From that second the contract counts how long you hold it, and it keeps counting until somebody takes it back.",
  },
  {
    n: "03",
    title: "At the bell, the longest reign takes the hour",
    body: `Every fee paid inside that hour goes to whoever wore the crown longest in it. All of it — ${pct(FEE_BPS)} of trading volume, no protocol cut, no cap.`,
  },
] as const;

/** The same hour, in minutes, used by both rows of the diagram. */
const example = [
  { who: "A", from: 0, to: 26 },
  { who: "B", from: 26, to: 42 },
  { who: "A", from: 42, to: 55 },
  { who: "D", from: 55, to: 60 },
] as const;

const totals = example.reduce<Record<string, number>>((acc, seg) => {
  acc[seg.who] = (acc[seg.who] ?? 0) + (seg.to - seg.from);
  return acc;
}, {});

function Bar({ winner }: { winner: string }) {
  return (
    <div className="flex h-9 w-full overflow-hidden rounded-full border border-rule bg-field-deep">
      {example.map((seg, i) => {
        const won = seg.who === winner;
        return (
          <div
            key={i}
            style={{ width: `${((seg.to - seg.from) / 60) * 100}%` }}
            className={clsx(
              "flex items-center justify-center border-r border-field-lit/70 last:border-r-0",
              won ? "bg-crown text-field-lit" : "bg-field text-ink-mute",
            )}
            title={`${seg.who}: ${seg.from}–${seg.to} min`}
          >
            <span className="type-label">{seg.to - seg.from >= 8 ? seg.who : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Rule() {
  const [volume, setVolume] = useState("100");
  const parsed = parseEth(volume);
  const pot = parsed === null ? null : potFromVolume(parsed);

  return (
    <section id="rule" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Label>[02] The rule</Label>
      <h2 className="type-head mt-4 max-w-[18ch] text-ink">
        Hold the top the longest. Take the hour.
      </h2>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-[3px] border border-rule bg-rule sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.n} className="bg-field-lit p-5 sm:p-6">
            <Label>{step.n}</Label>
            <h3 className="type-sub mt-3 text-ink">{step.title}</h3>
            <p className="type-body mt-2.5 text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>

      {/* ---- the same hour, settled two ways ------------------------------ */}
      <div className="plate mt-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Label>Why not simply the biggest holder at the bell</Label>
          <span className="type-label text-ink-mute">one hour, two rules</span>
        </div>

        <p className="type-body mt-4 max-w-[62ch] text-ink-soft">
          A snapshot at the bell is one sentence shorter to explain and it hands
          the hour to whoever shows up last. Below is a single hour with four
          reigns in it. Wallet D arrives with five minutes left. The amber
          segment is the one that gets paid.
        </p>

        <div className="mt-7 grid gap-7 lg:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="type-label text-crown">This contract — longest reign</span>
              <span className="type-data text-ink">
                A wins · {formatDuration(totals.A * 60)}
              </span>
            </div>
            <div className="mt-2.5">
              <Bar winner="A" />
            </div>
            <p className="type-data mt-2.5 text-ink-mute">
              D held for five minutes and scores five minutes. Reign time cannot
              be bought at the bell.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="type-label text-ink-soft">A closing snapshot</span>
              <span className="type-data text-ink">
                D wins · {formatDuration(totals.D * 60)}
              </span>
            </div>
            <div className="mt-2.5">
              <Bar winner="D" />
            </div>
            <p className="type-data mt-2.5 text-ink-mute">
              The whole hour goes to the last five minutes of it. Everyone who
              actually played the hour paid for that.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-2 border-t border-rule pt-4">
          {Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .map(([who, minutes]) => (
              <span key={who} className="type-data text-ink-mute">
                Wallet {who}
                <span className="ml-2 text-ink">
                  {((minutes * 60) / EPOCH_SECONDS * 100).toFixed(0)}% of the hour
                </span>
              </span>
            ))}
        </div>
      </div>

      {/* ---- what the hour is worth --------------------------------------- */}
      <div className="plate mt-4 p-5 sm:p-7">
        <Label>What an hour pays</Label>
        <div className="mt-5 grid items-end gap-6 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label htmlFor="volume" className="type-label block text-ink-mute">
              Volume traded in the hour (ETH)
            </label>
            <input
              id="volume"
              inputMode="decimal"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              className="plate-sunk type-figure mt-2.5 w-full min-w-0 rounded-[3px] px-4 py-3 text-ink outline-none focus-visible:ring-1 focus-visible:ring-ink"
            />
          </div>

          <div className="hidden pb-4 sm:block">
            <span className="type-label text-ink-mute">× {pct(FEE_BPS)} →</span>
          </div>

          <div>
            <Label>Goes to the longest reign</Label>
            <div className="type-figure-lg mt-2.5 text-crown">
              {pot === null ? "—" : formatEth(pot, 4)}
              <span className="type-data ml-1.5 align-middle text-ink-mute">ETH</span>
            </div>
          </div>
        </div>

        <p className="type-data mt-5 max-w-[68ch] border-t border-rule pt-4 text-ink-mute">
          One winner, one pot, nothing withheld — the figure on the right is the
          whole fee, computed by the same function the contract would use. An
          hour in which nobody ever took the crown pays nobody and rolls into
          the next one.
        </p>
      </div>
    </section>
  );
}
