import Link from "next/link";
import { Label } from "@/components/ui/Label";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] flex-col justify-center px-4 sm:px-6">
      <Label>Nothing here</Label>
      <h1 className="type-display mt-3 text-ink">There is one tile, and this is not it.</h1>
      <p className="type-body mt-4 max-w-[52ch] text-ink-soft">
        The whole game is on one page, which is most of the point.
      </p>
      <Link
        href="/"
        className="type-label mt-7 w-fit rounded-full bg-ink px-5 py-3 text-field-lit hover:bg-ink-soft"
      >
        Back to the hill
      </Link>
    </div>
  );
}
