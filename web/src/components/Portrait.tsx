import { useState } from "react";

type PortraitProps = {
  image: string | null;
  name: string;
  priority?: boolean;
  /** Larger monogram for the character page. */
  scale?: "plate" | "record";
};

/**
 * Ask the Wikia image service for a genuinely tiny raster, then let the browser
 * scale it with nearest-neighbour sampling (image-rendering: pixelated is set
 * globally). The result is a real mosaic — the same material the hand-drawn
 * scene is made of — and roughly twenty times less data per portrait.
 */
export function pixelUrl(image: string, width: number) {
  const [path, query] = image.split(/(?=[?#])/u);
  const base = path.replace(/\/revision\/latest.*$/u, "");
  return `${base}/revision/latest/scale-to-width-down/${width}${query ?? ""}`;
}

function initials(name: string) {
  const words = name.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  const [first, second] = words;
  return `${first?.[0] ?? "?"}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * The image, or the designed absence of one. 54% of the PotterDB corpus has no
 * portrait, so the empty case is part of the design: a monogram on an elevated
 * plate, which reads as a character tile rather than as a broken image.
 *
 * Two-stage source: the mosaic first, then the original file if that file has
 * no thumbnail to offer. `referrerPolicy="no-referrer"` is required, not a
 * preference — the image host answers 404 to any request that carries a
 * Referer header, so a browser that sends one gets nothing back.
 */
export function Portrait({ image, name, priority = false, scale = "plate" }: PortraitProps) {
  const [stage, setStage] = useState<"mosaic" | "original" | "monogram">("mosaic");
  const width = scale === "record" ? 96 : 64;

  const source =
    !image || stage === "monogram"
      ? null
      : stage === "original"
        ? image
        : pixelUrl(image, width);

  return (
    <div className="relative aspect-3/4 overflow-clip edge border-rule bg-paper-3">
      {source ? (
        <img
          src={source}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setStage(stage === "mosaic" ? "original" : "monogram")}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span
            aria-hidden="true"
            className={[
              "font-display text-muted select-none",
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
