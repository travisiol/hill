/*
 * The mark is the object, seen from the same angle, at 20px.
 *
 * A tile in three tones with a hairline band around its top: matter below,
 * the crown drawn above it. It is the hero's geometry reduced until only the
 * silhouette survives, which is the only kind of logo that survives a favicon.
 * No wordmark inside the glyph — the wordmark is set beside it in the same
 * typeface the page uses, so there is one voice and not two.
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
      {/* top */}
      <path d="M12 4.6 20 9.2 12 13.8 4 9.2Z" fill="var(--tile-top)" />
      {/* left */}
      <path d="M4 9.2 12 13.8v5.6L4 14.8Z" fill="var(--tile-left)" />
      {/* right */}
      <path d="M20 9.2 12 13.8v5.6l8-4.6Z" fill="var(--tile-right)" />
      {/* the crown band: drawn, not filled */}
      <path
        d="M12 2.1 22 7.9 12 13.7 2 7.9Z"
        stroke="var(--ink)"
        strokeOpacity="0.32"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
