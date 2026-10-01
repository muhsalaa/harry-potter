type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * A 2px boxed input in the page's own paper colour, lifted off an elevated
 * panel; the boundary is rule-strong so it clears 3:1 against every surface
 * (a lighter rule would leave the field invisible inside a frame).
 * States: default · hover · focus-visible · disabled · error. Success is the
 * form's job; an accepted field says nothing.
 *
 * The message slot is always rendered: an error that appears must not push the
 * page down around it.
 */
export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  error,
  disabled = false,
  placeholder,
}: FieldProps) {
  return (
    <div className="max-w-[var(--hp-measure)]">
      <label htmlFor={id} className="label block text-muted">
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-message`}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          "mt-1 block min-h-12 w-full edge bg-paper px-3 py-2 text-base",
          error ? "border-error" : "border-rule-strong hover:border-ink focus:border-accent",
          disabled ? "cursor-not-allowed text-muted" : "text-ink",
        ].join(" ")}
      />

      <p
        id={`${id}-message`}
        role={error ? "alert" : undefined}
        className={["mt-1 min-h-[1lh] text-sm", error ? "text-error" : "text-muted"].join(" ")}
      >
        {error ?? hint}
      </p>
    </div>
  );
}
