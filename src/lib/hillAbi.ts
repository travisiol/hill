/*
 * The two contracts this site reads.
 *
 * Written before either exists, on purpose. Every button and every readout on
 * the page is wired to a real call with real arguments and real decoding — the
 * only thing missing is an address, and the site says so where the address
 * would be rather than pretending the surface is a mock. When the module
 * deploys, one env var turns the page on.
 *
 * The shapes below are the shapes the mechanic needs, not a guess at somebody
 * else's interface:
 *
 *   claimCrown() takes no argument. It cannot: the balance that qualifies is
 *   the caller's balance at the moment of the call, and letting a caller pass
 *   a number would let them pass a number they do not have.
 *
 *   reignOf(epoch, holder) is seconds, uint32 — an hour is 3600, so this is
 *   absurdly wide, and it is uint32 because packing it next to an address in
 *   one slot is what makes the update cheap enough to run inside a transfer.
 *
 *   settle(epoch) is public and takes the epoch rather than assuming "the last
 *   one". Hours nobody traded in still have to close so their pot can roll,
 *   and a queue of unsettled hours must be drainable by anyone.
 */

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const crownAbi = [
  // ---- the standings ----------------------------------------------------
  {
    type: "function",
    name: "king",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "kingBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "crownedAt",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "function",
    name: "currentEpoch",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "reignOf",
    stateMutability: "view",
    inputs: [
      { name: "epoch", type: "uint256" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ name: "seconds_", type: "uint32" }],
  },
  {
    type: "function",
    name: "leaderOf",
    stateMutability: "view",
    inputs: [{ name: "epoch", type: "uint256" }],
    outputs: [
      { name: "holder", type: "address" },
      { name: "seconds_", type: "uint32" },
    ],
  },

  // ---- the money --------------------------------------------------------
  {
    type: "function",
    name: "potOf",
    stateMutability: "view",
    inputs: [{ name: "epoch", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "settled",
    stateMutability: "view",
    inputs: [{ name: "epoch", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ---- the two things anyone can do -------------------------------------
  {
    type: "function",
    name: "claimCrown",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [{ name: "epoch", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimPot",
    stateMutability: "nonpayable",
    inputs: [{ name: "epoch", type: "uint256" }],
    outputs: [{ name: "paid", type: "uint256" }],
  },

  // ---- the log the standings are rebuilt from ---------------------------
  {
    type: "event",
    name: "CrownTaken",
    inputs: [
      { name: "holder", type: "address", indexed: true },
      { name: "from", type: "address", indexed: true },
      { name: "balance", type: "uint256", indexed: false },
      { name: "at", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "HourSettled",
    inputs: [
      { name: "epoch", type: "uint256", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "seconds_", type: "uint32", indexed: false },
      { name: "pot", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PotRolled",
    inputs: [
      { name: "from", type: "uint256", indexed: true },
      { name: "to", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
