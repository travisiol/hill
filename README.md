# HILL — one tile, one hour, one king

King of the hill, on chain, with one square in the middle and nothing else to
do. Hold more `$HILL` than anybody, take the crown, and the contract counts
every second you keep it. When the hour ends, whoever wore it longest takes
**100% of that hour's trading fees**.

Nothing is deployed. This repository is the site and the rule; the contracts
are not written yet, and every figure on the page says so where the number
would otherwise be.

---

## The rule, and why it is this rule

The hour is the **UTC wall-clock hour**. Epoch `n` runs from `n·3600` to
`(n+1)·3600`. A rolling hour has no settlement moment, so there is never a pot
to win and nothing to watch; an aligned hour gives the game a horn.

The pot goes to the **longest reign inside the hour**, not to whoever is
holding the most at the bell. This is the decision the whole thing turns on.

A closing snapshot is one sentence shorter to explain and it ruins the game:
buy at 59:58, collect an hour of other people's fees, sell. Reign time cannot
be bought at the bell — a one-second reign scores one second — so the only way
to win an hour here is to have actually been on top through it. It is also the
literal reading of "holds the most for an hour".

The site makes that argument with a picture rather than a paragraph: the same
hour, four reigns, settled both ways, with the paid segment in amber. Under
this contract wallet A wins with 39 minutes. Under a snapshot, wallet D wins
with the last five.

The crown **moves on a claim, never on a transfer**. A token cannot find the
second-largest holder without walking an index of every holder, which no
transfer can afford. So anyone whose balance is strictly greater than the
king's calls `claimCrown()` and wears it from that second. A king who sells out
keeps the crown, and keeps banking seconds, until somebody takes it — an
inconvenience with an obvious cure, since taking it is what pays. The FAQ says
this out loud instead of implying the standings maintain themselves.

**Strictly greater, with no margin.** A cushion would let a king who is a
fraction ahead sit unchallengeable for the rest of the hour, and an
unchallengeable king is the one thing this game must not have. The cost is that
two whales can trade the crown back and forth; they pay gas each time, which is
a bad trade for them and a fine one for everyone watching.

## The economy

All of it is in [`src/lib/economics.ts`](src/lib/economics.ts), integer
arithmetic end to end.

| | |
|---|---|
| Trading fee | **1%**, both sides |
| To the hour's winner | **100%** |
| Protocol cut | **0** |
| Empty hour | pot **rolls** into the next one |
| Unclaimed pot | claimable **forever** |

The protocol cut is zero and that is not modesty, it is the headline being
literally true. There is no treasury address in the fee path, which is
checkable rather than promised. How this project funds itself, if it ever does,
is on the open list below rather than solved with a quiet slice.

An empty hour rolling forward is the correct direction for that incentive: the
pot should be loudest when the hill is empty.

**Three addresses are excluded from the standings** — the pool, the token
contract, the burn address. This is not housekeeping; it decides whether the
game works at all. A liquidity pool holds more of a token than any person ever
will, so an unfiltered largest-holder crown belongs to the pool from block one
and nobody can ever take it. It is a list rather than a heuristic because
guessing at contract-ness on chain also excludes multisigs and smart accounts,
which are people.

## What is actually live

Two of eight conditions, and the site renders them from one array so the
counter, the lamps and the prose cannot drift apart:

- **Standing** — the chain (Robinhood Chain, id 4663), read from the visitor's
  own browser every six seconds.
- **Standing** — the hour, which does not need a contract to be real. The ring
  turns and the light sweeps before anything is deployed.
- Awaiting launch — the token, the crown module, a fee hook that collects, a
  pool with liquidity, the excluded-address list, verified source.

The claim button is wired to a real `claimCrown()` with a real balance check;
the only thing missing is an address, and the button says so where the address
would be. Every disabled state names what is wrong, in the order a person hits
them.

## The worked hour

One switch fills the ring with a scripted example. It is **generated, never
typed** — the arcs, the standings, the durations and the pot all come out of
`crown.ts` and `economics.ts`, the same functions the chain path calls, so an
edit to the rule moves the example with it. It is marked in the canvas, on the
panel and on the switch, and there is no state where some figures are real and
others are the example.

## The drawing

One machined tile on a bench, in real perspective, drawn frame by frame into a
2D canvas. No WebGL, no textures, no raster assets.

- **The light is the clock.** The key light makes one turn per hour, placed
  opposite the minute hand so the cast shadow lies *along* the hand and the two
  are one instrument rather than two clocks disagreeing.
- **The ring is the hour.** Every reign is an arc of it; the longest arc is
  amber, because the longest arc is the one that gets paid.
- **Amber means worn.** The crown runs through the tile's chamfer and is a
  dashed hairline until somebody actually holds it. Before launch there is no
  amber in the canvas at all.

Notes from the passes that mattered, since they are not obvious from the code:

- The tile is **turned 35°**. Square to the camera it showed one flat face and
  read as an elevation drawing. 35° and not 45° because at 45° the two faces
  are identical and the silhouette becomes a symmetrical diamond, which is a
  logo.
- The camera came **up from 26° to 33°**. The low camera foreshortened the far
  half of the dial so hard that `:00` projected to the same height as the
  tile's far corner and disappeared behind it.
- Brushing on the top face is **linear, not concentric**. Circles on a square
  face came out as a bullseye and the object read as a target.
- The stage height tracks **width, not viewport height** — the model is sized
  by whichever is tighter, and on a phone that is always the width.
- The canvas element is sized **only by CSS**; the effect sets the backing
  store and nothing else. Writing `style.width` in pixels pins the element to
  whatever the last redraw measured, and redraws run on rAF, which stops in a
  backgrounded tab — that was 378px of horizontal scroll on a phone from an
  element that is nominally `w-full`.

## Running it

```bash
npm install && npm run dev
```

Port 3214. Copy `.env.example` to `.env.local` if you have addresses to point
at; without them the site is honest and inert, which is its default state.

## Not decided yet

None of these are stated as settled anywhere on the site.

1. **Where the fee is collected.** The mechanic needs a pool whose fee can be
   routed to the module on every swap, and which venue that is has not been
   chosen.
2. **Total supply and launch distribution.** A crown is only worth taking if
   the float is large enough that taking it costs something.
3. **Whether the fee is symmetric.** It is written as one rate on both sides; a
   lower sell-side rate would make the top cheaper to abandon.
4. **How the project funds itself, if at all.** There is no protocol cut, and
   nothing in its place.
5. **The regulatory reading** of a token that routes fees to a holder. Not
   settled, and not something a landing page settles.

## Naming

The name lives in three strings in
[`src/lib/site-config.ts`](src/lib/site-config.ts) — `name`, `wordmark`,
`ticker` — plus the `NEXT_PUBLIC_HILL_*` env prefix. Nothing else on the site
spells it out, so a rename is those three strings and the prefix. Do not
grep-and-replace through the components.

## Standing warning

`$HILL` is a game with an hourly payout, not an investment, and it should be
treated as money you are willing to lose. Nothing here is financial advice. The
chain values in `src/lib/chain.ts` came from public third-party sources and
must be re-verified against the official documentation before this app is
pointed at real funds.
