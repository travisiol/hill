"use client";

/*
 * The only button in the game.
 *
 * It is wired to a real call — `claimCrown()` on the crown module, no
 * arguments, with the caller's balance read on chain to decide whether the
 * call would revert before it is sent. The only missing piece is an address,
 * and where the address would be the button says so instead of pretending.
 *
 * Every disabled state names the thing that is wrong, in the order a person
 * hits them: no module, no wallet, wrong network, not enough tokens. A greyed
 * button with no reason is how a page teaches people not to trust it.
 */

import { useWriteContract } from "wagmi";
import { useConnection, useReadContract } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Awaiting, Label } from "@/components/ui/Label";
import { WalletConnect } from "@/components/WalletConnect";
import { crownAbi, erc20Abi } from "@/lib/hillAbi";
import { contracts, crownIsLive } from "@/lib/site-config";
import { robinhoodChain } from "@/lib/chain";
import { claimable } from "@/lib/crown";
import { useHill } from "@/lib/hillState";

export function ClaimCrown() {
  const { address, isConnected, chainId } = useConnection();
  const { preview } = useHill();

  const enabled = crownIsLive && isConnected && !!address;

  const { data: myBalance } = useReadContract({
    abi: erc20Abi,
    address: contracts.tokenAddress ?? undefined,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!contracts.tokenAddress },
  });

  const { data: kingBalance } = useReadContract({
    abi: crownAbi,
    address: contracts.crownAddress ?? undefined,
    functionName: "kingBalance",
    query: { enabled: enabled && !!contracts.crownAddress },
  });

  const { writeContract, isPending, error } = useWriteContract();

  const wrongNetwork = isConnected && chainId !== robinhoodChain.id;
  const canTake =
    enabled &&
    !wrongNetwork &&
    typeof myBalance === "bigint" &&
    typeof kingBalance === "bigint" &&
    claimable(kingBalance, myBalance);

  const reason = !crownIsLive
    ? "The crown module is not deployed. There is nothing to take yet."
    : !isConnected
      ? "Connect a wallet to see whether your balance clears the crown."
      : wrongNetwork
        ? `Switch to ${robinhoodChain.name} to take the crown.`
        : typeof myBalance !== "bigint" || typeof kingBalance !== "bigint"
          ? "Reading balances…"
          : canTake
            ? "Your balance is above the current king's. One transaction takes it."
            : "Your balance does not clear the current king's. Buy more, then take it.";

  return (
    <div className="plate flex flex-col p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>Take the hill</Label>
        {!crownIsLive && <Awaiting />}
      </div>

      <p className="type-body mt-3 text-ink-soft">
        The crown is taken, never handed over. Anyone holding strictly more than
        the current king can take it in one call, and starts banking seconds the
        moment they do.
      </p>

      <div className="mt-auto pt-5">
        {!isConnected && crownIsLive ? (
          <WalletConnect wrapperClassName="w-full" className="w-full justify-center" />
        ) : (
          <Button
            className="w-full"
            disabled={!canTake || isPending || preview}
            onClick={() => {
              if (!contracts.crownAddress) return;
              writeContract({
                abi: crownAbi,
                address: contracts.crownAddress,
                functionName: "claimCrown",
                chainId: robinhoodChain.id,
              });
            }}
          >
            {isPending ? "Confirm in your wallet…" : "Claim the crown"}
          </Button>
        )}

        <p className="type-data mt-3 text-ink-mute">
          {preview ? "Disabled while the worked hour is showing." : reason}
        </p>

        {error && (
          <p className="type-data mt-2 text-ink-soft">{error.message.split("\n")[0]}</p>
        )}
      </div>
    </div>
  );
}
