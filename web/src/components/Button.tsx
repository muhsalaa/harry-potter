import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: "slab" | "state" | "quiet";
};

/**
 * The slab button is a physical game button: 2px ink edge and a hard offset
 * shadow that snaps to nothing as the button sinks. Only transform is
 * transitioned — the shadow change is discrete on purpose, because a pixel
 * control changes state in frames, not in tweens.
 *
 * Three tones, three meanings: amber = an action, teal = a state you own,
 * quiet = a secondary affordance. Pass a variant, never a colour override —
 * two Tailwind utilities setting the same property do not resolve by order.
 *
 * States: default · hover · focus-visible · active · disabled · loading.
 * Error and success belong to the form around it, not to the button.
 */
export function Button({
  children,
  loading = false,
  variant = "slab",
  className = "",
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const off = disabled || loading;

  const tone =
    variant === "quiet"
      ? off
        ? "text-muted"
        : "text-muted hover:text-ink hover:underline active:translate-y-[var(--hp-pixel)]"
      : off
        ? "border-rule bg-paper-2 text-muted shadow-none"
        : variant === "state"
          ? "border-magic bg-magic text-accent-ink shadow-[var(--hp-shadow-key)] hover:bg-success active:translate-0.5 active:shadow-none"
          : "border-accent-deep bg-accent text-accent-ink shadow-[var(--hp-shadow-key)] hover:bg-focus active:translate-0.5 active:shadow-none";

  return (
    <button
      {...rest}
      type={type}
      disabled={off}
      aria-busy={loading || undefined}
      className={[
        "label inline-flex min-h-12 items-center justify-center whitespace-nowrap uppercase",
        variant === "quiet"
          ? "no-underline"
          : "border-[var(--hp-pixel)] px-5 py-2 transition-transform duration-[var(--hp-dur-micro)] ease-[var(--hp-ease-out)]",
        off ? "cursor-not-allowed" : "cursor-pointer",
        tone,
        className,
      ].join(" ")}
    >
      {loading ? "Working…" : children}
    </button>
  );
}
