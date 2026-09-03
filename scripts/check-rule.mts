/* Throwaway runtime check of the crown rule and the fee arithmetic. */
import assert from "node:assert/strict";
import {
  EPOCH_SECONDS,
  epochAt,
  epochStart,
  leaderOf,
  slicesFor,
  standingsFor,
  type Address,
  type CrownChange,
} from "../src/lib/crown";
import { FEE_BPS, feeOn, kingCut, potFor, settle } from "../src/lib/economics";

const A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;
const D = "0xdddddddddddddddddddddddddddddddddddddddd" as Address;

// A reign that crosses the bell must be credited to both hours separately.
const H = 1_800_000 * EPOCH_SECONDS; // an arbitrary hour boundary
const crossing: CrownChange[] = [{ holder: A, at: H - 11 * 60 }];
const sl = slicesFor(crossing, H + 20 * 60);
assert.equal(sl.length, 2, "a reign across the bell is two slices");
assert.equal(sl[0].epoch, epochAt(H) - 1);
assert.equal(sl[1].epoch, epochAt(H));
assert.equal(sl[0].to - sl[0].from, 11 * 60, "11 minutes land in the old hour");
assert.equal(sl[1].to - sl[1].from, 20 * 60, "20 minutes land in the new one");

// The headline case: the same hour, four reigns, a sniper at 55.
const script: CrownChange[] = [
  { holder: A, at: H + 0 },
  { holder: B, at: H + 26 * 60 },
  { holder: A, at: H + 42 * 60 },
  { holder: D, at: H + 55 * 60 },
];
const hour = slicesFor(script, H + EPOCH_SECONDS);
const table = standingsFor(hour, epochAt(H));
assert.equal(table[0].holder, A);
assert.equal(table[0].seconds, 39 * 60, "A held 26 + 13 = 39 minutes");
assert.equal(table[1].seconds, 16 * 60);
assert.equal(table[2].seconds, 5 * 60, "the sniper scores exactly what it held");
assert.equal(leaderOf(hour, epochAt(H))!.holder, A, "longest reign wins the hour");
assert.notEqual(
  script[script.length - 1].holder,
  leaderOf(hour, epochAt(H))!.holder,
  "and it is NOT whoever holds at the bell",
);
assert.equal(
  table.reduce((n, r) => n + r.seconds, 0),
  EPOCH_SECONDS,
  "the reigns tile the hour exactly",
);

// The reign in progress counts: standings mid-hour include the open reign.
const mid = standingsFor(slicesFor(script, H + 30 * 60), epochAt(H));
assert.equal(mid[0].holder, A);
assert.equal(mid[0].seconds, 26 * 60);
assert.equal(mid[1].seconds, 4 * 60, "B has banked four minutes so far");

// Ties keep the incumbent, i.e. whoever reached the total first.
const tied = standingsFor(
  slicesFor(
    [
      { holder: A, at: H },
      { holder: B, at: H + 10 * 60 },
    ],
    H + 20 * 60,
  ),
  epochAt(H),
);
assert.equal(tied[0].holder, A, "equal totals order by who got there first");

// An hour nobody played has no leader and nothing to pay.
assert.equal(leaderOf(slicesFor([], H + 600), epochAt(H)), null);

// Fees.
const oneEth = 10n ** 18n;
assert.equal(feeOn(100n * oneEth, FEE_BPS), oneEth, "1% of 100 ETH is 1 ETH");
assert.equal(kingCut(oneEth), oneEth, "the winner takes the whole pot");
assert.deepEqual(settle(oneEth, true), { paid: oneEth, rolls: 0n });
assert.deepEqual(settle(oneEth, false), { paid: 0n, rolls: oneEth }, "a dead hour rolls");
assert.equal(potFor(oneEth, 2n * oneEth), 3n * oneEth, "rollover adds to the next pot");

// Epoch boundaries are the UTC hour.
assert.equal(epochStart(epochAt(H + 59 * 60)), H);
assert.equal(epochAt(H + EPOCH_SECONDS), epochAt(H) + 1);

console.log("all crown and fee checks passed");
