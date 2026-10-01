/* The fold's one object: a candlelit tower library drawn on a 192 × 96 pixel
 * grid. Every shape is a <rect> snapped to that grid and filled with a
 * var(--hp-art-*) token, so the artwork obeys the same colour gate the rest of
 * the page does. Deterministic pseudo-randomness (not Math.random) keeps the
 * stars, spines and cobbles identical on every render.
 *
 * Drawn to survive `slice`: the central column (window, stair, cauldron) always
 * stays in frame, the shelf towers crop from the outside in on narrow screens.
 */

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

const StarFills = ["var(--hp-art-star)", "var(--hp-art-moon)"] as const;

/** Forty-odd stars, denser and brighter toward the top of the tower. */
function Stars() {
  const rand = rng(7);
  const stars = Array.from({ length: 46 }, () => ({
    x: Math.round(rand() * 190) + 1,
    y: Math.round(rand() * 30) + 2,
    bright: rand() > 0.86,
  }));
  return (
    <g>
      {stars.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={s.bright ? 2 : 1}
          height={s.bright ? 2 : 1}
          fill={s.bright ? StarFills[1] : StarFills[0]}
          opacity={s.bright ? 1 : 0.72}
        />
      ))}
    </g>
  );
}

/** The pennant strings the tower hangs across its own ceiling. */
function Pennants() {
  const xs = [18, 38, 58, 134, 154, 174];
  return (
    <g>
      <rect x={12} y={5} width={168} height={1} fill="var(--hp-art-stone)" />
      {xs.map((x) => (
        <g key={x}>
          <rect x={x} y={6} width={8} height={3} fill="var(--hp-art-banner)" />
          <rect x={x + 1} y={9} width={6} height={3} fill="var(--hp-art-banner)" />
          <rect x={x + 2} y={12} width={4} height={3} fill="var(--hp-art-banner)" />
          <rect x={x + 3} y={15} width={2} height={3} fill="var(--hp-art-banner)" />
        </g>
      ))}
    </g>
  );
}

/** A stone shelf tower: frame, seven shelves, and the spines that moved in. */
function Tower({ x }: { x: number }) {
  const rand = rng(x * 31 + 5);
  const rows = Array.from({ length: 7 }, (_, row) => {
    const y = 34 + row * 8;
    let cursor = x + 4;
    const spines: { x: number; w: number; h: number; fill: string }[] = [];
    while (cursor < x + 48) {
      const w = rand() > 0.7 ? 2 : 1;
      const h = 4 + Math.round(rand() * 2);
      spines.push({ x: cursor, w, h, fill: pick(BookFills, rand()) });
      cursor += w + 1;
    }
    return { y, spines };
  });

  return (
    <g>
      {/* the case */}
      <rect x={x} y={30} width={56} height={60} fill="var(--hp-art-stone)" />
      <rect x={x + 2} y={32} width={52} height={56} fill="var(--hp-art-sky)" />
      {rows.map((row, i) => (
        <g key={i}>
          {row.spines.map((s, j) => (
            <rect key={j} x={s.x} y={row.y + 6 - s.h} width={s.w} height={s.h} fill={s.fill} />
          ))}
          <rect x={x + 3} y={row.y + 6} width={50} height={2} fill="var(--hp-art-wood)" />
        </g>
      ))}
      {/* a lit shelf lip, so the case has a light source of its own */}
      <rect x={x + 3} y={42} width={50} height={1} fill="var(--hp-art-wood-2)" />
    </g>
  );
}

/** The arched windows: stepped arch, moonlit glass, two mullions. */
function Arch({
  x,
  y,
  w,
  h,
  moon = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  moon?: boolean;
}) {
  const cap = Math.round(w / 4) * 2;
  return (
    <g>
      <rect x={x} y={y + cap} width={w} height={h - cap} fill="var(--hp-art-stone)" />
      <rect x={x + 2} y={y + cap / 2} width={w - 4} height={cap} fill="var(--hp-art-stone)" />
      <rect x={x + 4} y={y + 2} width={w - 8} height={cap / 2} fill="var(--hp-art-stone)" />

      <rect x={x + 2} y={y + cap} width={w - 4} height={h - cap - 2} fill="var(--hp-art-window)" />
      <rect x={x + 4} y={y + cap / 2} width={w - 8} height={cap} fill="var(--hp-art-window)" />
      <rect x={x + 6} y={y + 2} width={w - 12} height={cap / 2} fill="var(--hp-art-window-2)" />

      {/* mullions */}
      <rect x={x + w / 2 - 1} y={y + 4} width={2} height={h - 6} fill="var(--hp-art-stone)" />
      <rect x={x + 2} y={y + Math.round(h * 0.55)} width={w - 4} height={2} fill="var(--hp-art-stone)" />

      {moon ? (
        <g fill="var(--hp-art-moon)">
          <rect x={x + w / 2 - 5} y={y + 8} width={10} height={10} />
          <rect x={x + w / 2 - 6} y={y + 10} width={12} height={6} />
          <rect x={x + w / 2 - 4} y={y + 6} width={8} height={14} />
        </g>
      ) : null}
    </g>
  );
}

/** The spiral stair the tower is built around. */
function Stairs() {
  const steps = Array.from({ length: 11 }, (_, i) => ({
    x: 82 + i * 3,
    y: 88 - i * 4,
    w: 14,
    h: 4,
  }));
  return (
    <g>
      {steps.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={s.y} width={s.w} height={2} fill="var(--hp-art-stone-2)" />
          <rect x={s.x} y={s.y + 2} width={s.w} height={s.h - 2} fill="var(--hp-art-stone)" />
        </g>
      ))}
      {/* the rail, one pixel proud of the treads */}
      {steps.map((s, i) => (
        <rect key={i} x={s.x + s.w - 2} y={s.y - 6} width={1} height={6} fill="var(--hp-art-wood-2)" />
      ))}
    </g>
  );
}

/** Floating candles: the light the reader navigates by. Finite flicker. */
function Candles() {
  const spots = [
    { x: 30, y: 22, delay: "0s" },
    { x: 68, y: 16, delay: "-0.3s" },
    { x: 122, y: 18, delay: "-0.6s" },
    { x: 158, y: 24, delay: "-0.2s" },
    { x: 48, y: 62, delay: "-0.5s" },
    { x: 142, y: 60, delay: "-0.4s" },
  ];
  return (
    <g>
      {spots.map((c) => (
        <g key={`${c.x}-${c.y}`}>
          <rect x={c.x} y={c.y} width={3} height={7} fill="var(--hp-art-candle)" />
          <rect
            x={c.x}
            y={c.y - 3}
            width={3}
            height={3}
            fill="var(--hp-art-flame)"
            style={{
              animation: "hp-flicker 1.2s var(--hp-ease-sprite) 4",
              animationDelay: c.delay,
            }}
          />
        </g>
      ))}
    </g>
  );
}

/** The cauldron, its dithered glow, and three bubbles that rise and stop. */
function Cauldron() {
  const rand = rng(41);
  const glow = Array.from({ length: 18 }, () => ({
    x: Math.round(66 + rand() * 60),
    y: Math.round(84 + rand() * 8),
  }));
  return (
    <g>
      {/* dithered magic light spilled on the floor */}
      {glow.map((g, i) => (
        <rect
          key={i}
          x={g.x}
          y={g.y}
          width={g.x % 2 === 0 ? 2 : 1}
          height={1}
          fill="var(--hp-art-leaf)"
          opacity={0.55}
        />
      ))}
      <rect x={92} y={76} width={16} height={2} fill="var(--hp-art-stone-2)" />
      <rect x={94} y={78} width={12} height={6} fill="var(--hp-art-stone)" />
      <rect x={95} y={84} width={3} height={2} fill="var(--hp-art-stone-2)" />
      <rect x={102} y={84} width={3} height={2} fill="var(--hp-art-stone-2)" />
      {/* the brew */}
      <rect x={95} y={77} width={10} height={1} fill="var(--hp-art-leaf)" />
      {[
        { x: 97, delay: "0s" },
        { x: 100, delay: "-0.7s" },
        { x: 103, delay: "-1.2s" },
      ].map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={76}
          width={1}
          height={1}
          fill="var(--hp-art-leaf)"
          style={{ animation: "hp-bubble 2.4s var(--hp-ease-sprite) 3", animationDelay: b.delay }}
        />
      ))}
    </g>
  );
}

/** Vine growth hanging off the arches, and the cobbled floor band. */
function FloorAndVines() {
  const rand = rng(97);
  const vines = [22, 40, 76, 116, 150, 168].map((x) => ({ x, len: 5 + Math.round(rand() * 9) }));
  const cobbles = Array.from({ length: 16 }, (_, i) => ({
    x: i * 12,
    w: rand() > 0.5 ? 12 : 10,
    fill: rand() > 0.5 ? "var(--hp-art-stone)" : "var(--hp-art-stone-2)",
  }));
  return (
    <g>
      {vines.map((v) => (
        <g key={v.x} fill="var(--hp-art-leaf)">
          <rect x={v.x} y={26} width={1} height={v.len} />
          <rect x={v.x + 1} y={30} width={2} height={1} />
          <rect x={v.x + 1} y={34} width={1} height={1} />
        </g>
      ))}
      <rect x={0} y={88} width={192} height={8} fill="var(--hp-art-sky)" />
      <rect x={0} y={88} width={192} height={2} fill="var(--hp-art-stone-2)" />
      {cobbles.map((c, i) => (
        <rect key={i} x={c.x} y={92} width={c.w} height={2} fill={c.fill} opacity={0.8} />
      ))}
    </g>
  );
}

export function PixelScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 192 96"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x={0} y={0} width={192} height={96} fill="var(--hp-art-sky)" />
      <Stars />
      <Pennants />
      <Arch x={84} y={8} w={24} h={40} moon />
      <Arch x={44} y={30} w={16} h={22} />
      <Arch x={132} y={30} w={16} h={22} />
      <Tower x={4} />
      <Tower x={132} />
      <Stairs />
      <Candles />
      <Cauldron />
      <FloorAndVines />
      {/* the two arches that frame the stair, drawn last so they sit in front */}
      <Arch x={72} y={44} w={12} h={26} />
      <Arch x={110} y={44} w={12} h={26} />
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
