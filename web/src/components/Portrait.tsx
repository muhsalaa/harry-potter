import { useState } from "react";

import { PixelPortrait } from "./pixel";

type PortraitProps = {
  image: string | null;
  name: string;
  priority?: boolean;
  /** How wide a mosaic to ask the image service for. */
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

/**
 * The image, or the designed absence of one. Half the PotterDB corpus has no
 * portrait, and the image host drops some of the rest, so the empty case is not
 * an edge case — it is half the grid. It gets a drawn plate instead: night sky
 * and one pixel object, chosen from four by the character's name, so no tile is
 * ever blank paper and no two neighbours are handed the same picture.
 *
 * Two-stage source: the mosaic first, then the original file if that file has
 * no thumbnail to offer. `referrerPolicy="no-referrer"` is required, not a
 * preference — the image host answers 404 to any request that carries a
 * Referer header, so a browser that sends one gets nothing back.
 */
export function Portrait({ image, name, priority = false, scale = "plate" }: PortraitProps) {
  const [stage, setStage] = useState<"mosaic" | "original" | "drawn">("mosaic");
  const width = scale === "record" ? 96 : 64;

  const source =
    !image || stage === "drawn"
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
          onError={() => setStage(stage === "mosaic" ? "original" : "drawn")}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <PixelPortrait seed={name} className="h-full w-full" />
      )}
    </div>
  );
}
