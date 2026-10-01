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
 * Label above the input, hairline under it. States: default · hover ·
 * focus-visible · disabled · error. Success is the form's job — a field that
 * has been accepted has nothing left to say.
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
  const describedBy = `${id}-message`;

  return (
    <div className="max-w-[var(--hp-measure)]">
      <label
        htmlFor={id}
        className="numeric block text-xs tracking-[0.12em] text-muted uppercase"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          "mt-1 block min-h-11 w-full border-b border-rule bg-transparent py-2 text-base",
          error ? "border-error" : "hover:border-rule-strong focus:border-ink",
          disabled ? "cursor-not-allowed bg-paper-2 text-muted" : "text-ink",
        ].join(" ")}
      />

      {/* The slot is always present: an appearing error must not push the page
          down (gate 39). */}
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
