/*
 * The mark is the scene, reduced until only what survives a favicon is left.
 *
 * The hero has a block, a figure on it with both arms up, a crown, and a
 * crowd. At 20px the crowd is noise, so the glyph keeps the three shapes that
 * carry the idea on their own: the block seen from the model's angle, a figure
 * standing on it, and the crown above.
 *
 * The proportions are the canvas king's, not a fresh guess, and the first pass
 * proved why that matters. A narrow arm V with a thick short torso came out as
 * a chess pawn — the arms read as the flare of a stem and the head as its cap.
 * What makes a raised-arms figure legible at any size is the same thing that
 * makes it legible at 500px: the arms have to clear the head by more than
 * their own width, and the torso has to be narrower than the gap between them.
 *
 * The block is drawn first so its top face never crops the feet standing on it.
 *
 * The crown is the only amber — but filled, where the canvas draws it as an
 * outline until somebody wears it. The canvas is a readout and has to report
 * an empty throne; a mark is an identity and has to be the same tomorrow.
 *
 * No wordmark inside the glyph; the wordmark is set beside it in the page's own
 * typeface, so there is one voice and not two.
 */
export function Mark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* the block, at the model's angle */}
      <path d="M12 13.4 20 16.8 12 20.2 4 16.8Z" fill="var(--tile-top)" />
      <path d="M4 16.8 12 20.2v2.5L4 19.3Z" fill="var(--tile-left)" />
      <path d="M20 16.8 12 20.2v2.5l8-3.4Z" fill="var(--tile-right)" />

      {/* legs, torso, arms */}
      <path
        d="M11.1 15.3v-1.9M12.9 15.3v-1.9"
        stroke="var(--tile-left)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M12 13.6v-2.2"
        stroke="var(--tile-top)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M11 12.4 9 9M13 12.4 15 9"
        stroke="var(--tile-left)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* head */}
      <circle cx="12" cy="10" r="1.5" fill="var(--tile-top-lit)" />

      {/* the crown, held up */}
      <path d="M8.4 8.8V5.4l1.9 1.5L12 4.6l1.7 2.3 1.9-1.5v3.4Z" fill="var(--crown)" />
    </svg>
  );
}
