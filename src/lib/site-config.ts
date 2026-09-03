export const siteConfig = {
  // Placeholder name — not final. `name` is the all-caps lockup (metadata,
  // nav, OG image); `wordmark` is the title-case form the hero sets; `ticker`
  // is derived from it. Nothing else on the site spells the name out, so a
  // rename is these three strings plus the env prefix below.
  name: "HILL",
  wordmark: "Hill",
  ticker: "$HILL",
  tagline: "One tile. One hour. One king.",
  description:
    "A single tile at the centre. Whoever holds the most tokens through an hour wears the crown and takes every fee that hour collected. Buy more, take it.",
  seoDescription:
    "King of the hill, on chain. One tile, one hour, one winner — the longest reign of each hour takes 100% of that hour's trading fees.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hill.example",
  x: process.env.NEXT_PUBLIC_HILL_X ?? null,
  telegram: process.env.NEXT_PUBLIC_HILL_TELEGRAM ?? null,
} as const;

function envOrNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

/**
 * The token and the crown module.
 *
 * Split into two addresses on purpose, and the site has to be able to say
 * which of the two is standing: a token can be live and trading for a week
 * before a crown module is wired to its fee hook, and during that week the
 * honest thing to show is a token with no game attached, not a countdown to
 * nothing.
 *
 * Both are env-driven so no placeholder address ships hardcoded. With either
 * unset the whole action surface sits disabled with the reason on the button.
 */
export const contracts = {
  tokenAddress: envOrNull(
    process.env.NEXT_PUBLIC_HILL_TOKEN_ADDRESS,
  ) as `0x${string}` | null,
  crownAddress: envOrNull(
    process.env.NEXT_PUBLIC_HILL_CROWN_ADDRESS,
  ) as `0x${string}` | null,
  /** The pool the fee is collected from. Excluded from the standings. */
  poolAddress: envOrNull(
    process.env.NEXT_PUBLIC_HILL_POOL_ADDRESS,
  ) as `0x${string}` | null,
  isLive: process.env.NEXT_PUBLIC_HILL_LIVE === "true",
} as const;

/** The token exists and can be read. */
export const tokenIsLive = contracts.isLive && contracts.tokenAddress !== null;

/** The game actually runs, which needs the crown module and a pool behind it. */
export const crownIsLive =
  tokenIsLive && contracts.crownAddress !== null && contracts.poolAddress !== null;

export const nav = [
  { href: "#hill", label: "The hill" },
  { href: "#rule", label: "The rule" },
  { href: "#standing", label: "What stands" },
  { href: "#faq", label: "FAQ" },
] as const;
