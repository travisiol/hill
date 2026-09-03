"use client";

import { useEffect, useState } from "react";
import { useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi";
import { clsx } from "clsx";
import { robinhoodChain } from "@/lib/chain";
import { shortAddress } from "@/lib/crown";

/**
 * Whether a wallet is actually reachable in this browser.
 *
 * wagmi registers the injected connector whether or not anything is there to
 * inject, so its presence says nothing — trusting it leaves the button enabled
 * on a machine with no wallet, where pressing it does nothing at all. This
 * looks for a real provider: `window.ethereum` for older wallets, and the
 * EIP-6963 announcement current ones use.
 *
 * Starts optimistic so the server render and the first client render agree,
 * then corrects itself once the browser has had a moment to answer.
 */
function useWalletAvailable(): boolean {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let found = typeof window !== "undefined" && "ethereum" in window;

    const onAnnounce = () => {
      found = true;
      setAvailable(true);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const timer = window.setTimeout(() => setAvailable(found), 400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
    };
  }, []);

  return available;
}

export function WalletConnect({
  className,
  wrapperClassName,
  showHint = true,
}: {
  className?: string;
  wrapperClassName?: string;
  /**
   * The explanation under the button. On by default, because a disabled button
   * with no reason is the thing this component exists to avoid — but in a 56px
   * rail there is no room for two lines of it, and the same explanation is
   * repeated beside the hero button a screen below.
   */
  showHint?: boolean;
}) {
  const { address, isConnected, chainId } = useConnection();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: isSwitching } = useSwitchChain();
  const walletAvailable = useWalletAvailable();

  const shell = "type-label rounded-full px-3.5 py-2 transition-colors duration-150";

  if (isConnected && address) {
    if (chainId !== robinhoodChain.id) {
      return (
        <button
          type="button"
          onClick={() => switchChain({ chainId: robinhoodChain.id })}
          disabled={isSwitching}
          className={clsx(shell, "bg-ink text-field-lit hover:bg-ink-soft", className)}
        >
          {isSwitching ? "Switching…" : "Switch network"}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect wallet"
        className={clsx(
          shell,
          "flex items-center gap-2 text-ink ring-1 ring-rule-strong ring-inset hover:bg-ink hover:text-field-lit",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" aria-hidden />
        {shortAddress(address)}
      </button>
    );
  }

  const connector = connectors[0];
  const canConnect = walletAvailable && !!connector;

  return (
    <span className={clsx("inline-flex flex-col items-start gap-1", wrapperClassName)}>
      <button
        type="button"
        disabled={!canConnect || isConnecting}
        onClick={() => connector && connect({ connector })}
        title={canConnect ? undefined : "No browser wallet detected on this device"}
        className={clsx(
          shell,
          "bg-ink text-field-lit hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ink-mute disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset",
          className,
        )}
      >
        {isConnecting ? "Connecting…" : canConnect ? "Connect wallet" : "No wallet found"}
      </button>

      {showHint && connectError && (
        <span className="type-data max-w-[240px] text-ink-soft">
          {connectError.message.split("\n")[0]}
        </span>
      )}
      {showHint && !canConnect && !connectError && (
        <span className="type-data max-w-[240px] text-ink-mute">
          Install a browser wallet to connect.
        </span>
      )}
    </span>
  );
}
