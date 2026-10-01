/* The catalogue's one illustration: a candlelit tower library drawn on a
 * 384 × 192 pixel grid. Every shape is a <rect> snapped to that grid and filled
 * with a var(--hp-art-*) token, so the artwork obeys the same colour gate the
 * rest of the page does. Deterministic pseudo-randomness (not Math.random)
 * keeps the stars, spines, panes and cobbles identical on every render.
 *
 * Density is the point: books are one pixel wide, glass is divided into 1px
 * panes, the stone carries mortar lines. Displayed at 2× (768px) the blocks
 * land on whole device pixels; below that they subdivide smoothly, never blur.
 */

import { PORTRAIT_H, PORTRAIT_W, portraitArt } from "./portraits";

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
};

const pick = <T,>(list: readonly T[], r: number) => list[Math.floor(r * list.length) % list.length];

const BookFills = [
  "var(--hp-art-book-a)",
  "var(--hp-art-book-b)",
  "var(--hp-art-book-c)",
  "var(--hp-art-book-d)",
] as const;

const W = 384;
const H = 192;

/** A field of stars, thinning out below the pennants. */
function Stars() {
  const rand = rng(7);
  const stars = Array.from({ length: 108 }, () => ({
    x: Math.round(rand() * (W - 2)) + 1,
    y: Math.round(rand() * 74) + 3,
    big: rand() > 0.9,
  }));
  return (
    <g>
      {stars.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={s.big ? 2 : 1}
          height={s.big ? 2 : 1}
          fill={s.big ? "var(--hp-art-moon)" : "var(--hp-art-star)"}
          opacity={s.big ? 1 : 0.75}
        />
      ))}
    </g>
  );
}

/** The pennant strings hung across the tower's own ceiling. */
function Pennants() {
  const xs = [26, 70, 114, 214, 258, 302, 346];
  return (
    <g>
      <rect x={16} y={8} width={W - 32} height={1} fill="var(--hp-art-stone)" />
      {xs.map((x) => (
        <g key={x} fill="var(--hp-art-banner)">
          <rect x={x} y={9} width={16} height={4} />
          <rect x={x + 1} y={13} width={14} height={4} />
          <rect x={x + 2} y={17} width={12} height={4} />
          <rect x={x + 3} y={21} width={10} height={4} />
          <rect x={x + 5} y={25} width={6} height={3} />
        </g>
      ))}
      {/* the little knots where each cord meets the line */}
      {xs.map((x) => (
        <rect key={`k${x}`} x={x + 7} y={7} width={2} height={2} fill="var(--hp-art-candle)" />
      ))}
    </g>
  );
}

/** Mortar lines: the cheapest way to make stone read as masonry. */
function Masonry({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const courses = Math.floor(h / 8);
  const joints = Math.floor(w / 16);
  return (
    <g fill="var(--hp-art-sky)" opacity={0.5}>
      {Array.from({ length: courses }, (_, i) => (
        <rect key={`c${i}`} x={x} y={y + i * 8} width={w} height={1} />
      ))}
      {Array.from({ length: joints }, (_, i) =>
        Array.from({ length: courses }, (_, j) => (
          <rect key={`j${i}-${j}`} x={x + i * 16 + (j % 2 ? 8 : 0)} y={y + j * 8} width={1} height={8} />
        )),
      )}
    </g>
  );
}

/** A shelf tower: eight bays of one-pixel spines, banded by shelf lips. */
function Tower({ x }: { x: number }) {
  const rand = rng(x * 31 + 5);
  const bays = Array.from({ length: 8 }, (_, row) => {
    const y = 76 + row * 12;
    let cursor = x + 6;
    const spines: { x: number; w: number; h: number; fill: string; lean: boolean }[] = [];
    while (cursor < x + 82) {
      const w = rand() > 0.82 ? 2 : 1;
      const h = 6 + Math.round(rand() * 3);
      spines.push({
        x: cursor,
        w,
        h,
        fill: pick(BookFills, rand()),
        lean: rand() > 0.94,
      });
      cursor += w + 1;
    }
    return { y, spines };
  });

  return (
    <g>
      <rect x={x} y={68} width={88} height={116} fill="var(--hp-art-stone)" />
      <rect x={x + 3} y={71} width={82} height={110} fill="var(--hp-art-sky)" />
      <Masonry x={x} y={68} w={88} h={116} />

      {bays.map((bay, i) => (
        <g key={i}>
          {bay.spines.map((s, j) =>
            s.lean ? (
              <g key={j} fill={s.fill}>
                <rect x={s.x} y={bay.y + 10 - s.h} width={s.w} height={s.h - 1} />
                <rect x={s.x + 1} y={bay.y + 10 - s.h} width={s.w} height={2} />
              </g>
            ) : (
              <rect key={j} x={s.x} y={bay.y + 10 - s.h} width={s.w} height={s.h} fill={s.fill} />
            ),
          )}
          {/* the shelf lip, lit along its top edge */}
          <rect x={x + 4} y={bay.y + 10} width={80} height={2} fill="var(--hp-art-wood)" />
          <rect x={x + 4} y={bay.y + 10} width={80} height={1} fill="var(--hp-art-wood-2)" />
        </g>
      ))}

      {/* the case's own pilasters */}
      <rect x={x + 1} y={68} width={2} height={116} fill="var(--hp-art-stone-2)" />
      <rect x={x + 85} y={68} width={2} height={116} fill="var(--hp-art-stone-2)" />
    </g>
  );
}

type ArchProps = { x: number; y: number; w: number; h: number; cols?: number; rows?: number; moon?: boolean };

/**
 * An arched window with real leading: the glass is divided into 1px-mullioned
 * panes, a few of which are brighter, which is what reads as glass at this size.
 */
function Arch({ x, y, w, h, cols = 4, rows = 6, moon = false }: ArchProps) {
  const step = Math.round(w / 6) * 2;
  const rand = rng(Math.round(x * 7 + y));
  const paneW = Math.floor((w - 6) / cols);
  const paneH = Math.floor((h - step - 6) / rows);

  return (
    <g>
      <rect x={x} y={y + step} width={w} height={h - step} fill="var(--hp-art-stone)" />
      <rect x={x + 2} y={y + step / 2} width={w - 4} height={step} fill="var(--hp-art-stone)" />
      <rect x={x + 4} y={y + 2} width={w - 8} height={step / 2} fill="var(--hp-art-stone)" />
      <Masonry x={x} y={y + step} w={w} h={h - step} />

      <g>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const lit = rand();
            return (
              <rect
                key={`${r}-${c}`}
                x={x + 3 + c * paneW}
                y={y + step + 2 + r * paneH}
                width={paneW}
                height={paneH}
                fill={lit > 0.72 ? "var(--hp-art-window-2)" : "var(--hp-art-window)"}
              />
            );
          }),
        )}
      </g>

      {/* leading: an outer rebate plus one bar through both axes */}
      <rect x={x + 2} y={y + step - 1} width={w - 4} height={1} fill="var(--hp-art-stone-2)" />
      <rect x={x + Math.floor(w / 2)} y={y + step} width={1} height={h - step - 2} fill="var(--hp-art-stone-2)" />
      <rect x={x + 2} y={y + step + Math.round((h - step) / 2)} width={w - 4} height={1} fill="var(--hp-art-stone-2)" />

      {moon ? (
        <g fill="var(--hp-art-moon)">
          <rect x={x + w / 2 - 9} y={y + 16} width={18} height={18} />
          <rect x={x + w / 2 - 11} y={y + 20} width={22} height={10} />
          <rect x={x + w / 2 - 7} y={y + 12} width={14} height={26} />
          <rect x={x + w / 2 - 13} y={y + 23} width={2} height={4} opacity={0.6} />
          <rect x={x + w / 2 + 11} y={y + 23} width={2} height={4} opacity={0.6} />
        </g>
      ) : null}
    </g>
  );
}

/** The spiral stair, its rail, and the balcony it lands on. */
function Stairs() {
  const steps = Array.from({ length: 15 }, (_, i) => ({
    x: 172 + i * 4,
    y: 174 - i * 6,
    w: 24,
    h: 6,
  }));
  return (
    <g>
      {steps.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={s.y} width={s.w} height={2} fill="var(--hp-art-stone-2)" />
          <rect x={s.x} y={s.y + 2} width={s.w} height={s.h - 2} fill="var(--hp-art-stone)" />
          <rect x={s.x + 4} y={s.y + 4} width={s.w - 8} height={1} fill="var(--hp-art-sky)" opacity={0.4} />
        </g>
      ))}
      {steps.map((s, i) => (
        <g key={`r${i}`} fill="var(--hp-art-wood-2)">
          <rect x={s.x + s.w - 3} y={s.y - 10} width={1} height={10} />
          <rect x={s.x + s.w - 3} y={s.y - 10} width={1} height={1} />
        </g>
      ))}
      <rect x={172} y={100} width={24} height={1} fill="var(--hp-art-wood-2)" />
    </g>
  );
}

/** Floating candles — the light the reader navigates by. Finite flicker. */
function Candles() {
  const spots = [
    { x: 60, y: 44, delay: "0s" },
    { x: 136, y: 34, delay: "-0.3s" },
    { x: 244, y: 36, delay: "-0.6s" },
    { x: 320, y: 46, delay: "-0.2s" },
    { x: 96, y: 124, delay: "-0.5s" },
    { x: 284, y: 120, delay: "-0.4s" },
    { x: 28, y: 150, delay: "-0.1s" },
    { x: 352, y: 148, delay: "-0.35s" },
  ];
  return (
    <g>
      {spots.map((c) => (
        <g key={`${c.x}-${c.y}`}>
          <rect x={c.x} y={c.y} width={4} height={14} fill="var(--hp-art-candle)" />
          <rect x={c.x} y={c.y + 14} width={4} height={1} fill="var(--hp-art-wood)" opacity={0.5} />
          <rect
            x={c.x + 1}
            y={c.y - 5}
            width={2}
            height={5}
            fill="var(--hp-art-flame)"
            style={{
              animation: "hp-flicker 1.2s var(--hp-ease-sprite) 4",
              animationDelay: c.delay,
            }}
          />
          <rect x={c.x + 3} y={c.y - 3} width={1} height={3} fill="var(--hp-art-flame)" opacity={0.6} />
        </g>
      ))}
    </g>
  );
}

/** The cauldron, its dithered glow, and bubbles that rise and stop. */
function Cauldron() {
  const rand = rng(41);
  const glow = Array.from({ length: 64 }, () => ({
    x: Math.round(140 + rand() * 104),
    y: Math.round(176 + rand() * 12),
    w: rand() > 0.5 ? 2 : 1,
  }));
  return (
    <g>
      {glow.map((g, i) => (
        <rect key={i} x={g.x} y={g.y} width={g.w} height={1} fill="var(--hp-art-leaf)" opacity={0.5} />
      ))}

      <rect x={180} y={150} width={32} height={4} fill="var(--hp-art-stone-2)" />
      <rect x={183} y={154} width={26} height={3} fill="var(--hp-art-stone)" />
      <rect x={185} y={157} width={22} height={14} fill="var(--hp-art-stone)" />
      <rect x={188} y={171} width={16} height={5} fill="var(--hp-art-stone)" />
      <rect x={190} y={176} width={4} height={4} fill="var(--hp-art-stone-2)" />
      <rect x={198} y={176} width={4} height={4} fill="var(--hp-art-stone-2)" />
      <rect x={184} y={166} width={24} height={1} fill="var(--hp-art-sky)" opacity={0.45} />
      {/* the brew */}
      <rect x={186} y={151} width={20} height={3} fill="var(--hp-art-leaf)" />
      <rect x={189} y={152} width={6} height={1} fill="var(--hp-art-window-2)" opacity={0.7} />
      {[
        { x: 190, delay: "0s" },
        { x: 195, delay: "-0.7s" },
        { x: 199, delay: "-1.2s" },
        { x: 203, delay: "-1.6s" },
      ].map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={148}
          width={1}
          height={1}
          fill="var(--hp-art-leaf)"
          style={{ animation: "hp-bubble 2.4s var(--hp-ease-sprite) 3", animationDelay: b.delay }}
        />
      ))}
    </g>
  );
}

/** Vine growth off the arches, a lectern by the stair, and the cobbled floor. */
function FloorAndVines() {
  const rand = rng(97);
  const vines = [40, 74, 130, 166, 218, 254, 310, 344].map((x) => ({ x, len: 12 + Math.round(rand() * 22) }));
  const cobbles = Array.from({ length: 26 }, (_, i) => ({
    x: i * 15,
    w: rand() > 0.5 ? 15 : 13,
    fill: rand() > 0.5 ? "var(--hp-art-stone)" : "var(--hp-art-stone-2)",
  }));
  return (
    <g>
      {vines.map((v) => (
        <g key={v.x} fill="var(--hp-art-leaf)">
          <rect x={v.x} y={52} width={1} height={v.len} />
          {Array.from({ length: Math.floor(v.len / 6) }, (_, i) => (
            <rect key={i} x={v.x + (i % 2 ? -2 : 1)} y={56 + i * 6} width={2} height={1} />
          ))}
        </g>
      ))}

      {/* a lectern with a book open on it */}
      <g>
        <rect x={250} y={158} width={18} height={3} fill="var(--hp-art-wood)" />
        <rect x={252} y={161} width={3} height={16} fill="var(--hp-art-wood)" />
        <rect x={263} y={161} width={3} height={16} fill="var(--hp-art-wood)" />
        <rect x={248} y={153} width={22} height={5} fill="var(--hp-art-candle)" />
        <rect x={258} y={153} width={2} height={5} fill="var(--hp-art-wood)" />
      </g>

      <rect x={0} y={176} width={W} height={16} fill="var(--hp-art-sky)" />
      <rect x={0} y={176} width={W} height={2} fill="var(--hp-art-stone-2)" />
      {cobbles.map((c, i) => (
        <rect key={i} x={c.x} y={181} width={c.w} height={3} fill={c.fill} opacity={0.85} />
      ))}
      {cobbles.map((c, i) => (
        <rect key={`b${i}`} x={c.x - 7} y={186} width={c.w} height={3} fill={c.fill} opacity={0.6} />
      ))}
    </g>
  );
}

export function PixelScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x={0} y={0} width={W} height={H} fill="var(--hp-art-sky)" />
      <Stars />
      <Pennants />

      {/* the far wall: three windows, the grand one carrying the moon */}
      <Arch x={96} y={64} w={40} h={64} cols={4} rows={6} />
      <Arch x={248} y={64} w={40} h={64} cols={4} rows={6} />
      <Arch x={164} y={16} w={56} h={104} cols={6} rows={10} moon />

      <Tower x={4} />
      <Tower x={292} />

      <Stairs />
      <Candles />
      <Cauldron />
      <FloorAndVines />

      {/* framing arches, drawn last so they stand in front of the stair */}
      <Arch x={140} y={96} w={22} h={56} cols={2} rows={5} />
      <Arch x={222} y={96} w={22} h={56} cols={2} rows={5} />
    </svg>
  );
}

/**
 * A portrait plate for a character with no picture: one of four drawn objects on
 * a night sky, chosen by the name (see portraits.ts). Drawn at the tile's own
 * 3:4, so it fills the frame the photographs fill.
 */
export function PixelPortrait({ seed, className = "" }: { seed: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${PORTRAIT_W} ${PORTRAIT_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {portraitArt(seed).map((rect, index) => (
        <rect
          key={index}
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill={`var(--hp-art-${rect.fill})`}
          opacity={rect.opacity}
        />
      ))}
    </svg>
  );
}

/** Small sprites for empty states — same grid, same tokens, 16 × 16. */
export function PixelGlyph({
  kind,
  className = "",
}: {
  kind: "cauldron" | "star" | "quill";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" focusable="false">
      {kind === "cauldron" ? (
        <g>
          <rect x={2} y={5} width={12} height={2} fill="var(--hp-art-stone-2)" />
          <rect x={3} y={7} width={10} height={5} fill="var(--hp-art-stone)" />
          <rect x={5} y={12} width={2} height={2} fill="var(--hp-art-stone-2)" />
          <rect x={9} y={12} width={2} height={2} fill="var(--hp-art-stone-2)" />
          <rect x={5} y={6} width={6} height={1} fill="var(--hp-art-leaf)" />
          <rect x={6} y={3} width={1} height={1} fill="var(--hp-art-leaf)" />
          <rect x={9} y={1} width={1} height={1} fill="var(--hp-art-leaf)" />
        </g>
      ) : null}
      {kind === "star" ? (
        <g fill="var(--hp-art-flame)">
          <rect x={7} y={1} width={2} height={14} />
          <rect x={1} y={7} width={14} height={2} />
          <rect x={3} y={3} width={2} height={2} />
          <rect x={11} y={3} width={2} height={2} />
          <rect x={3} y={11} width={2} height={2} />
          <rect x={11} y={11} width={2} height={2} />
        </g>
      ) : null}
      {kind === "quill" ? (
        <g>
          <rect x={9} y={1} width={4} height={4} fill="var(--hp-art-candle)" />
          <rect x={8} y={4} width={4} height={4} fill="var(--hp-art-candle)" />
          <rect x={6} y={7} width={4} height={3} fill="var(--hp-art-candle)" />
          <rect x={4} y={10} width={3} height={3} fill="var(--hp-art-window-2)" />
          <rect x={3} y={13} width={2} height={2} fill="var(--hp-art-stone-2)" />
        </g>
      ) : null}
    </svg>
  );
}
