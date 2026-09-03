"use client";

/*
 * The stage.
 *
 * The model is the argument, so it gets the frame and the readings sit around
 * its edge like the annotations on a drawing rather than in a dashboard below
 * it. Four numbers, and each one answers a question somebody would actually
 * ask in the order they would ask it: how long is left, who is winning, by how
 * much, and what is it worth.
 *
 * The overlays are absolute on a wide screen and stack under the model on a
 * narrow one. They are not the same content at two sizes — the mobile stack
 * drops the leader line and keeps the figure, because a leader line pointing
 * at something two hundred pixels away is a decoration.
 */

import { clsx } from "clsx";
import { Hill } from "@/components/Hill";
import { Standings } from "@/components/Standings";
import { ClaimCrown } from "@/components/ClaimCrown";
import { Awaiting, Label, PreviewTag } from "@/components/ui/Label";
import { useHill } from "@/lib/hillState";
import { epochLabel, formatClock, formatDuration, shortAddress } from "@/lib/crown";
import { formatEth } from "@/lib/economics";
import { previewLabel } from "@/lib/preview";

export function HillStage() {
  const { now, preview, setPreview, live, changes, leader, king, remaining, pot, epoch } =
    useHill();

  const hasReign = leader !== null;
  const kingName = king ? (previewLabel(king.holder) ?? shortAddress(king.holder)) : null;

  return (
    <div className="mt-10 sm:mt-14">
      {/* ---- the model ---------------------------------------------------- */}
      <div className="relative">
        <Hill
          changes={changes}
          live={live}
          preview={preview}
          /*
           * Height tracks WIDTH, not viewport height. The model is sized by
           * whichever of the two is tighter, and on a phone that is always the
           * width — so a vh-tall stage left a small object marooned in the
           * middle of a 470px box with a dead band above and below it. Tying
           * the box to the width keeps the framing the same at every size.
           */
          className="h-[clamp(300px,68vw,560px)] w-full select-none"
        />

        {/* Top left: the clock. The only figure that matters every second. */}
        <div className="pointer-events-none absolute top-0 left-0 hidden sm:block">
          <div className="plate pointer-events-auto px-4 py-3">
            <Label>{now === null ? "This hour" : epochLabel(epoch)}</Label>
            <div className="type-figure-lg mt-1 text-ink">
              {now === null ? "--:--" : formatClock(remaining)}
            </div>
            <div className="type-data mt-0.5 text-ink-mute">left in this hour</div>
          </div>
        </div>

        {/* Top right: the pot. Zero is a real answer and it is shown as one. */}
        <div className="pointer-events-none absolute top-0 right-0 hidden sm:block">
          <div className="plate pointer-events-auto min-w-[176px] px-4 py-3 text-right">
            <Label className="justify-end">This hour&apos;s pot</Label>
            <div
              className={clsx(
                "type-figure-lg mt-1",
                pot > 0n ? "text-crown" : "text-ink-mute",
              )}
            >
              {formatEth(pot, 4)}
              <span className="type-data ml-1.5 align-middle text-ink-mute">ETH</span>
            </div>
            <div className="type-data mt-0.5 text-ink-mute">
              {live || preview ? "100% to the longest reign" : "no fees collected yet"}
            </div>
          </div>
        </div>

        {/* Bottom: who holds it. Centred under the tile it describes. */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex justify-center">
          <div className="plate pointer-events-auto flex items-center gap-4 px-4 py-2.5">
            <span className="flex items-center gap-2.5">
              <span
                className={clsx(
                  "h-2 w-2 rounded-full",
                  hasReign ? "bg-crown" : "awaiting bg-ink-soft",
                )}
                aria-hidden
              />
              <Label>On the hill</Label>
            </span>
            <span className="rule-h h-4 w-px shrink-0 bg-rule" aria-hidden />
            {hasReign && kingName ? (
              <span className="type-data text-ink">{kingName}</span>
            ) : (
              <span className="type-data text-ink-mute">Nobody yet</span>
            )}
            {hasReign && leader && (
              <>
                <span className="hidden h-4 w-px shrink-0 bg-rule sm:block" aria-hidden />
                <span className="type-data hidden text-crown sm:block">
                  {formatDuration(leader.seconds)} held
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---- the same readings, stacked, on a narrow screen ---------------- */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
        <div className="plate px-4 py-3">
          <Label>Hour ends in</Label>
          <div className="type-figure mt-1 text-ink">
            {now === null ? "--:--" : formatClock(remaining)}
          </div>
        </div>
        <div className="plate px-4 py-3">
          <Label>Pot</Label>
          <div className={clsx("type-figure mt-1", pot > 0n ? "text-crown" : "text-ink-mute")}>
            {formatEth(pot, 3)} ETH
          </div>
        </div>
      </div>

      {/* ---- the switch, and what it is ----------------------------------- */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {preview ? (
            <PreviewTag />
          ) : live ? (
            <span className="type-label inline-flex items-center gap-1.5 rounded-full bg-crown px-2.5 py-1 text-field-lit">
              Live
            </span>
          ) : (
            <Awaiting />
          )}
          <span className="type-data max-w-[42ch] text-ink-mute">
            {preview
              ? "A scripted hour, generated by the same functions the chain path uses. No wallet, no pot, no payout."
              : live
                ? "Reigns and pot are read from the crown module."
                : "Nothing is deployed, so there are no reigns to draw and the pot is zero."}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPreview(!preview)}
          aria-pressed={preview}
          className={clsx(
            "type-label rounded-full px-4 py-2.5 transition-colors duration-150",
            preview
              ? "bg-ink text-field-lit hover:bg-ink-soft"
              : "text-ink ring-1 ring-rule-strong ring-inset hover:bg-ink hover:text-field-lit",
          )}
        >
          {preview ? "Hide the worked hour" : "Show a worked hour"}
        </button>
      </div>

      {/* ---- the standings and the one thing you can do -------------------- */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Standings />
        <ClaimCrown />
      </div>
    </div>
  );
}
