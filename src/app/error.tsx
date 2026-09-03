"use client";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] flex-col justify-center px-4 sm:px-6">
      <Label>Frame dropped</Label>
      <h1 className="type-display mt-3 text-ink">Something on this page failed to render.</h1>
      <p className="type-body mt-4 max-w-[52ch] text-ink-soft">
        Nothing on this page moves money, so nothing was left half-done. The
        hour kept running while this was broken.
      </p>
      <div className="mt-7">
        <Button onClick={reset}>Redraw</Button>
      </div>
    </div>
  );
}
