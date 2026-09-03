"use client";

/*
 * The standings, and they are standings of TIME, not of balance.
 *
 * This is the one place the site can be misread, so the column is called
 * "held" and the bar is a bar of the hour rather than of a token balance.
 * Somebody who bought the biggest bag two minutes ago is bottom of this list
 * and should look like it — that is the rule, and a leaderboard sorted by
 * holdings would quietly teach the opposite of the thing the contract does.
 *
 * The bar under each row is the same arc as on the model, unrolled. Same
 * ranking, same tones, so glancing between the two never asks anyone to
 * re-derive who is winning.
 */

import { clsx } from "clsx";
import { Label } from "@/components/ui/Label";
import { useHill } from "@/lib/hillState";
import { EPOCH_SECONDS, formatDuration, shortAddress } from "@/lib/crown";
import { previewLabel } from "@/lib/preview";

export function Standings() {
  const { standings, king, now, preview, live } = useHill();

  return (
    <div className="plate p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>Standings — this hour</Label>
        <span className="type-label text-ink-mute">by time held</span>
      </div>

      {standings.length === 0 ? (
        <div className="mt-5 flex min-h-[132px] flex-col justify-center gap-2">
          <p className="type-data text-ink">
            {now === null ? "Reading the clock…" : "No reign recorded this hour."}
          </p>
          <p className="type-data max-w-[46ch] text-ink-mute">
            {live
              ? "Nobody has taken the crown since the bell. The pot rolls into the next hour if it stays that way."
              : "The crown module is not deployed, so there is nothing to read. This is an empty list, not a loading one."}
          </p>
        </div>
      ) : (
        <ol className="mt-4 flex flex-col">
          {standings.map((row, index) => {
            const wearing = king?.holder === row.holder;
            const name = previewLabel(row.holder) ?? shortAddress(row.holder);
            return (
              <li
                key={row.holder}
                className="border-t border-rule py-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2.5">
                    <span
                      className={clsx(
                        "type-label shrink-0",
                        index === 0 ? "text-crown" : "text-ink-mute",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="type-data truncate text-ink">{name}</span>
                    {wearing && (
                      <span className="type-label shrink-0 text-crown">wearing it</span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      "type-data tnum shrink-0",
                      index === 0 ? "text-crown" : "text-ink-soft",
                    )}
                  >
                    {formatDuration(row.seconds)}
                  </span>
                </div>

                {/* The arc, unrolled. Width is the share of the whole hour,
                    never of the leader, so a hour that is barely started
                    looks barely started. */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-field-deep">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-[width] duration-700 ease-out",
                      index === 0 ? "bg-crown" : index === 1 ? "bg-ink-soft" : "bg-ink-mute",
                    )}
                    style={{ width: `${Math.min(100, (row.seconds / EPOCH_SECONDS) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {preview && standings.length > 0 && (
        <p className="type-data mt-4 border-t border-rule pt-3 text-ink-mute">
          Wallets and reigns above are the worked example. The arithmetic is not
          — every duration here came out of the same function the contract call
          would feed.
        </p>
      )}
    </div>
  );
}
