"use client";

/*
 * What stands.
 *
 * Every condition this game needs, each one saying what has to be true and
 * what is actually the case. The list is rendered from one array, so the
 * counter, the lamps and the prose cannot drift apart — and the two that are
 * closed are closed because something was genuinely checked, not because a
 * launch page needs a couple of green lights.
 *
 * It is here rather than in a footnote because a page that shows a payout
 * mechanism and no deployment has exactly one honest thing to lead with.
 */

import { clsx } from "clsx";
import { ChainReadout } from "@/components/ChainReadout";
import { Label } from "@/components/ui/Label";
import { contracts, crownIsLive, tokenIsLive } from "@/lib/site-config";
import { robinhoodChain } from "@/lib/chain";
import { EXCLUDED_ROLES } from "@/lib/economics";

interface Condition {
  must: string;
  is: string;
  closed: boolean;
}

const conditions: Condition[] = [
  {
    must: "A chain to run on",
    is: `${robinhoodChain.name}, chain id ${robinhoodChain.id}, answering the read below from your browser right now.`,
    closed: true,
  },
  {
    must: "An hour to play for",
    is: "Epochs are the UTC hour. The clock above is your own machine's, aligned to the same boundary the contract would use.",
    closed: true,
  },
  {
    must: "The token deployed",
    is: tokenIsLive
      ? `Token at ${contracts.tokenAddress}.`
      : "No token address is configured. Every balance on this page is therefore unread, not zero.",
    closed: tokenIsLive,
  },
  {
    must: "The crown module deployed",
    is: crownIsLive
      ? `Crown module at ${contracts.crownAddress}.`
      : "Awaiting launch. The calls are written and wired; there is no address behind them.",
    closed: crownIsLive,
  },
  {
    must: "A fee hook that actually collects",
    is: "Awaiting launch. Until a pool routes its fee into the module, an hour's pot is zero however busy the hour was.",
    closed: false,
  },
  {
    must: "A pool with liquidity in it",
    is: "Awaiting launch. Nothing can be bought, so nothing can be held, so nobody can be king.",
    closed: false,
  },
  {
    must: "The excluded addresses set",
    is: "Awaiting launch. The pool and the token contract have to be excluded from the standings before the first block, not after.",
    closed: false,
  },
  {
    must: "Verified source on the explorer",
    is: "Awaiting launch. Nothing on this page should be taken on trust while the bytecode cannot be read.",
    closed: false,
  },
];

export function Standing() {
  const closed = conditions.filter((c) => c.closed).length;

  return (
    <section id="standing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>[03] What stands</Label>
          <h2 className="type-head mt-4 max-w-[20ch] text-ink">
            Eight things have to be true. Two of them are.
          </h2>
        </div>
        <span className="type-figure text-ink-mute">
          {closed}/{conditions.length}
        </span>
      </div>

      <p className="type-body mt-6 max-w-[64ch] text-ink-soft">
        This list is the honest version of a launch countdown. Each line says
        what the game needs and what is actually the case today, in the words a
        person would use to check it themselves.
      </p>

      <ul className="mt-10 overflow-hidden rounded-[3px] border border-rule">
        {conditions.map((condition) => (
          <li
            key={condition.must}
            className="flex flex-col gap-2 border-b border-rule bg-field-lit p-4 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6 sm:p-5"
          >
            <span className="flex shrink-0 items-center gap-3 sm:w-[16rem]">
              <span
                className={clsx(
                  "h-2 w-2 shrink-0 rounded-full",
                  condition.closed ? "bg-crown" : "awaiting bg-ink-mute",
                )}
                aria-hidden
              />
              <span className="type-data text-ink">{condition.must}</span>
            </span>
            <span className="type-data flex-1 break-words text-ink-mute">{condition.is}</span>
            <span
              className={clsx(
                "type-label shrink-0 sm:w-[7rem] sm:text-right",
                condition.closed ? "text-crown" : "text-ink-mute",
              )}
            >
              {condition.closed ? "Standing" : "Awaiting launch"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <ChainReadout />
      </div>

      {/* The exclusion list is part of what stands, not an appendix — an
          unfiltered largest-holder crown belongs to the pool forever. */}
      <div className="plate mt-4 p-5 sm:p-7">
        <Label>Who cannot wear the crown</Label>
        <p className="type-body mt-3 max-w-[64ch] text-ink-soft">
          A liquidity pool holds more of a token than any person ever will. If
          the standings counted it, the crown would belong to the pool from the
          first block and no one could ever take it. Three addresses are
          therefore excluded, and they are a list rather than a rule — guessing
          at contract-ness on chain also excludes multisigs and smart accounts,
          which are people.
        </p>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-[3px] border border-rule bg-rule sm:grid-cols-3">
          {EXCLUDED_ROLES.map((row) => (
            <div key={row.role} className="bg-field-lit p-4">
              <dt className="type-data text-ink">{row.role}</dt>
              <dd className="type-data mt-1.5 text-ink-mute">{row.why}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
