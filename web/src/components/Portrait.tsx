type PortraitProps = {
  image: string | null;
  name: string;
  priority?: boolean;
  /** Larger monogram for the character page. */
  scale?: "plate" | "record";
};

function initials(name: string) {
  const words = name.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  const [first, second] = words;
  return `${first?.[0] ?? "?"}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * The image, or the designed absence of one. 54% of the PotterDB corpus has no
 * portrait, so the empty case is part of the design: a monogram on the second
 * paper tone, which reads as a printed index rather than as a broken image.
 */
export function Portrait({ image, name, priority = false, scale = "plate" }: PortraitProps) {
  return (
    <div className="relative aspect-3/4 border border-rule bg-paper-2">
      {image ? (
        <img
          src={image}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span
            aria-hidden="true"
            className={[
              "font-display text-rule-strong select-none",
              scale === "record" ? "text-display" : "text-3xl",
            ].join(" ")}
          >
            {initials(name)}
          </span>
        </div>
      )}
    </div>
  );
}
