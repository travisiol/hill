import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * Two shapes and nothing between them. A control you press is a pill, because
 * on a bench of square plates the round thing is the thing your hand goes to;
 * a surface you read is a 3px plate. Anything in between would be decoration.
 *
 * The filled button is ink, never amber. Amber means the crown is worn or
 * money moved, and a button you have not pressed yet is neither.
 *
 * A disabled button keeps its label and states its reason. A grey rectangle
 * with no explanation is the failure this whole page is arranged against.
 */
const base =
  "type-label inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 transition-all duration-150 disabled:cursor-not-allowed";

const solid =
  "bg-ink text-field-lit shadow-[0_1px_0_rgba(255,255,255,0.55),0_10px_20px_-14px_rgba(16,19,23,0.85)] hover:-translate-y-px hover:bg-ink-soft active:translate-y-0";

export function Button({
  children,
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      className={clsx(
        base,
        variant === "solid"
          ? `${solid} disabled:translate-y-0 disabled:bg-transparent disabled:text-ink-mute disabled:shadow-none disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset`
          : "text-ink ring-1 ring-rule-strong ring-inset hover:bg-ink hover:text-field-lit disabled:text-ink-mute disabled:ring-rule",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a href={href} className={clsx(base, solid, className)}>
      {children}
    </a>
  );
}
