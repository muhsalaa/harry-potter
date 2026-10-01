/**
 * Four portrait plates for the characters the corpus has no picture of, and the
 * rule that hands one out.
 *
 * Every plate is a stack of rectangles on a 48 × 64 grid — the portrait tile's
 * own 3:4 — filled with `--hp-art-*` tokens, so the placeholders obey the same
 * colour gate as the scene in `pixel.tsx`. They are data rather than markup
 * because that is what they are: no curves, no transforms, nothing a rectangle
 * cannot say, and a list of rectangles can be read, diffed and drawn elsewhere.
 *
 * The plate is chosen by a hash of the name, never by `Math.random()`: a tile
 * must not change its art between two renders, and two characters shelved next
 * to each other should not be handed the same one.
 */

export type ArtRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** An `--hp-art-*` token name — the renderer wraps it in `var()`. */
  fill: string;
  opacity?: number;
};

const W = 48;
const H = 64;

/** The grid the plates are drawn on — the tile's own 3:4, so an SVG of this
 *  size fills a portrait box exactly. */
export const PORTRAIT_W = W;
export const PORTRAIT_H = H;

/** Deterministic pseudo-randomness — the same plate draws the same stars ever after. */
const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
};

/** The night the plates stand in, with its own scatter of stars. */
function sky(seed: number): ArtRect[] {
  const rand = rng(seed);
  // pulled one pixel in from the edges: a "big" star is 2 × 2 and must still land whole
  const stars = Array.from({ length: 16 }, () => ({
    x: Math.round(rand() * (W - 4)) + 1,
    y: Math.round(rand() * (H - 5)) + 2,
    big: rand() > 0.85,
  }));

  return [
    { x: 0, y: 0, w: W, h: H, fill: "sky" },
    ...stars.map((s) => ({
      x: s.x,
      y: s.y,
      w: s.big ? 2 : 1,
      h: s.big ? 2 : 1,
      fill: "star",
      opacity: s.big ? 1 : 0.7,
    })),
  ];
}

/** A pointed hat: cone, band, buckle, brim with an underside. */
const HAT: ArtRect[] = [
  ...[
    { y: 12, x: 23, w: 2 },
    { y: 14, x: 22, w: 4 },
    { y: 18, x: 21, w: 6 },
    { y: 22, x: 19, w: 10 },
    { y: 26, x: 17, w: 14 },
    { y: 30, x: 15, w: 18 },
    { y: 34, x: 13, w: 22 },
    { y: 38, x: 11, w: 26 },
    { y: 42, x: 9, w: 30 },
  ].map((row) => ({ ...row, h: 4, fill: "stone" })),
  // the light down the cone's left flank, stepping with each row
  ...[26, 30, 34, 38, 42].map((y, i) => ({ x: 19 - i * 2, y, w: 2, h: 4, fill: "stone-2" })),
  { x: 9, y: 46, w: 30, h: 6, fill: "wood-2" },
  { x: 20, y: 45, w: 9, h: 9, fill: "candle" },
  { x: 23, y: 48, w: 3, h: 3, fill: "sky" },
  { x: 2, y: 52, w: 44, h: 5, fill: "stone-2" },
  { x: 5, y: 57, w: 38, h: 3, fill: "stone" },
];

/** A stoppered flask, half full, with something still rising through it. */
const POTION: ArtRect[] = [
  { x: 20, y: 7, w: 8, h: 6, fill: "wood-2" },
  { x: 21, y: 13, w: 6, h: 10, fill: "window" },
  { x: 19, y: 21, w: 10, h: 4, fill: "stone-2" },
  ...[
    { y: 25, x: 15, w: 18 },
    { y: 29, x: 12, w: 24 },
    { y: 33, x: 10, w: 28 },
    { y: 37, x: 8, w: 32 },
    { y: 41, x: 8, w: 32 },
    { y: 45, x: 8, w: 32 },
    { y: 49, x: 8, w: 32 },
    { y: 53, x: 10, w: 28 },
    { y: 57, x: 14, w: 20 },
  ].map((row) => ({ ...row, h: 4, fill: "window" })),
  ...[
    { y: 37, x: 10, w: 28 },
    { y: 41, x: 10, w: 28 },
    { y: 45, x: 10, w: 28 },
    { y: 49, x: 10, w: 28 },
    { y: 53, x: 12, w: 24 },
    { y: 57, x: 16, w: 16 },
  ].map((row) => ({ ...row, h: 4, fill: "leaf" })),
  { x: 22, y: 15, w: 2, h: 6, fill: "window-2" },
  { x: 12, y: 39, w: 2, h: 14, fill: "moon", opacity: 0.5 },
  { x: 23, y: 31, w: 2, h: 2, fill: "candle" },
  { x: 26, y: 43, w: 2, h: 2, fill: "candle" },
  { x: 19, y: 48, w: 2, h: 2, fill: "candle" },
  { x: 28, y: 53, w: 2, h: 2, fill: "candle" },
];

/** A candle in its stick, lit, with wax running down one side. */
const CANDLE: ArtRect[] = [
  { x: 23, y: 6, w: 2, h: 4, fill: "flame" },
  { x: 22, y: 10, w: 4, h: 14, fill: "flame" },
  { x: 23, y: 14, w: 2, h: 8, fill: "moon" },
  { x: 23, y: 24, w: 2, h: 4, fill: "wood" },
  { x: 16, y: 28, w: 2, h: 12, fill: "candle" },
  { x: 30, y: 30, w: 2, h: 8, fill: "candle" },
  { x: 18, y: 28, w: 12, h: 26, fill: "moon" },
  { x: 19, y: 28, w: 3, h: 26, fill: "candle" },
  { x: 14, y: 54, w: 20, h: 5, fill: "stone-2" },
  { x: 20, y: 59, w: 8, h: 4, fill: "stone" },
  { x: 10, y: 63, w: 28, h: 1, fill: "stone-2" },
];

/** A closed book: board, spine, fore-edge of pages, a gilt rule and star, a ribbon. */
const BOOK: ArtRect[] = [
  { x: 7, y: 20, w: 30, h: 38, fill: "book-a" },
  { x: 7, y: 20, w: 30, h: 3, fill: "book-b" },
  { x: 7, y: 55, w: 30, h: 3, fill: "book-b" },
  { x: 7, y: 20, w: 5, h: 38, fill: "book-b" },
  { x: 37, y: 24, w: 4, h: 30, fill: "moon" },
  { x: 17, y: 30, w: 14, h: 2, fill: "candle" },
  { x: 17, y: 36, w: 9, h: 2, fill: "candle" },
  { x: 23, y: 44, w: 2, h: 8, fill: "candle" },
  { x: 20, y: 47, w: 8, h: 2, fill: "candle" },
  { x: 22, y: 58, w: 5, h: 6, fill: "banner" },
];

const ARTS: ArtRect[][] = [
  [...sky(11), ...HAT],
  [...sky(29), ...POTION],
  [...sky(47), ...CANDLE],
  [...sky(71), ...BOOK],
];

/** The plate this character has been shelved under, for as long as it exists. */
export function portraitArt(seed: string): ArtRect[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 1000003;
  return ARTS[hash % ARTS.length];
}
