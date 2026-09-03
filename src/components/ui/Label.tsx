import { clsx } from "clsx";
import type { ReactNode } from "react";

/** An annotation on the drawing: mono, tracked out, never bold. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={clsx("type-label text-ink-mute", className)}>{children}</span>;
}

/**
 * Held.
 *
 * There is no warning colour on this page — an amber lamp would let a state
 * that is waiting look designed instead of saying so — which means this has to
 * carry the words. It says them in ink with a hairline around it, the same
 * weight as everything else that is drawn but not standing. A screenshot with
 * the animation stopped still reads correctly.
 */
export function Awaiting({
  children = "Awaiting launch",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 rounded-full border border-rule-strong px-2.5 py-1 text-ink-soft",
        className,
      )}
    >
      <span className="awaiting h-1.5 w-1.5 rounded-full bg-ink-soft" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Marks the worked example. Sits inside whatever it labels rather than beside
 * it, so a crop of a screenshot still carries the word.
 */
export function PreviewTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-field-lit",
        className,
      )}
    >
      Preview — not real
    </span>
  );
}

/** A figure and its key. */
export function Reading({
  label,
  value,
  held,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  held?: boolean;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      <span className={clsx("type-figure", held ? "text-ink-mute" : "text-ink")}>{value}</span>
      {hint && <span className="type-data text-ink-mute">{hint}</span>}
    </div>
  );
}
