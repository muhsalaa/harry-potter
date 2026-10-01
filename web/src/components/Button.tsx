import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: "slab" | "quiet";
};

/**
 * C1 · outlined chip. Square corners, mono label, instant state changes —
 * newsprint's duration scale is 0×, so this button does not move.
 * States: default · hover · focus-visible · active · disabled · loading.
 * Error and success are carried by the form around it, not by the button.
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
        : "text-ink hover:text-accent-deep hover:underline hover:underline-offset-2"
      : off
        ? "border-rule text-muted"
        : "border-ink text-ink hover:bg-ink hover:text-paper active:bg-accent-deep active:border-accent-deep";

  return (
    <button
      {...rest}
      type={type}
      disabled={off}
      aria-busy={loading || undefined}
      className={[
        "numeric inline-flex items-center justify-center whitespace-nowrap text-xs uppercase tracking-[0.12em]",
        variant === "slab" ? "min-h-11 border px-4 py-2" : "underline-offset-2",
        tone,
        className,
      ].join(" ")}
    >
      {loading ? "Working…" : children}
    </button>
  );
}
