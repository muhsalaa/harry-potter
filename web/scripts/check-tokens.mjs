// Guards the two token disciplines Hallmark's slop test checks by hand:
//   1. every colour lives in tokens.css — nothing inline elsewhere (gate 48)
//   2. the pairs the design depends on clear their contrast floor (gates 40–41)
// Run: node scripts/check-tokens.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const src = join(web, "src");
const tokensPath = join(src, "styles", "tokens.css");

const tokens = readFileSync(tokensPath, "utf8");

function token(name) {
  const match = tokens.match(new RegExp(`--hp-${name}:\\s*oklch\\(([^)]+)\\)`));
  if (!match) throw new Error(`tokens.css has no oklch token --${name}`);
  const [l, c, h] = match[1]
    .trim()
    .replace(/%/g, "")
    .split(/\s+/)
    .map(Number);
  return { l: l / 100, c, h };
}

// OKLCH → linear sRGB → WCAG relative luminance.
function luminance({ l: L, c: C, h: H }) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const lms = [
    (L + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (L - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (L - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ];

  const [r, g, bl] = [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ].map((channel) => Math.min(1, Math.max(0, channel)));

  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The sRGB hex a token resolves to — for the two values index.html must inline. */
function hexOf({ l: L, c: C, h: H }) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);
  const lms = [
    (L + 0.3963377774 * a + 0.2158037573 * b) ** 3,
    (L - 0.1055613458 * a - 0.0638541728 * b) ** 3,
    (L - 0.0894841775 * a - 1.291485548 * b) ** 3,
  ];
  return `#${[
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ]
    .map((channel) => {
      const v = Math.max(0, Math.min(1, channel));
      const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
      return Math.round(255 * srgb)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

const floors = [
  ["ink", 7, "body copy"],
  ["muted", 4.5, "secondary copy"],
  ["accent", 4.5, "link · amber action"],
  ["accent-deep", 4.5, "button edge"],
  ["magic", 4.5, "owned state (favorited · saved)"],
  ["error", 4.5, "error message"],
  ["success", 4.5, "confirmation text"],
  ["rule-strong", 3, "interactive boundary"],
  ["focus", 3, "focus ring (WCAG 2.4.11)"],
  ["neutral", 3, "large or decorative type"],
];

// Every text role is checked against every surface it can sit on, so reusing a
// pair on --hp-paper-2 later cannot silently drop below its floor.
const surfaces = ["paper", "paper-2", "paper-3"];
const failures = [];

for (const surface of surfaces) {
  const background = token(surface);
  console.log(`\n· on --hp-${surface}`);

  for (const [name, floor, role] of floors) {
    const ratio = contrast(token(name), background);
    const ok = ratio >= floor;
    if (!ok) {
      failures.push(`${name} on ${surface} is ${ratio.toFixed(2)}:1, needs ${floor}:1 (${role})`);
    }
    console.log(
      `${ok ? "ok  " : "FAIL"} ${name.padEnd(12)} ${ratio.toFixed(2)}:1  ≥ ${floor}:1  ${role}`,
    );
  }
}

const paper = token("paper");

// Text that sits ON a filled control, which the surface sweep above cannot see.
// The fills are the pale "lit surface" tokens, not the bronze text accent.
console.log("\n· on filled controls");
for (const fill of ["accent-fill", "magic-fill"]) {
  const ratio = contrast(token("accent-ink"), token(fill));
  const ok = ratio >= 7;
  if (!ok) failures.push(`accent-ink on ${fill} is ${ratio.toFixed(2)}:1, needs 7:1`);
  console.log(
    `${ok ? "ok  " : "FAIL"} accent-ink / ${fill.padEnd(11)} ${ratio.toFixed(2)}:1  ≥ 7:1  button label`,
  );
}

// Walk the source for colour literals outside the token block.
const colourLiteral = /(oklch|rgb|rgba|hsl|hsla)\(|#[0-9a-fA-F]{3,8}\b/;
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|css)$/.test(entry) ? [path] : [];
  });
}

let strays = 0;
for (const path of walk(src)) {
  if (path === tokensPath) continue;
  const offenders = readFileSync(path, "utf8")
    .split("\n")
    .map((line, index) => [index + 1, line])
    .filter(([, line]) => colourLiteral.test(line));

  for (const [number, line] of offenders) {
    strays += 1;
    console.log(`FAIL colour literal ${path.replace(web + "/", "")}:${number} → ${line.trim()}`);
  }
}

if (strays) failures.push(`${strays} colour literal(s) outside tokens.css`);

// index.html cannot read CSS variables, so two of its values duplicate tokens:
// the theme-color meta and the favicon's paper + accent hexes.
const html = readFileSync(join(web, "index.html"), "utf8");
const themeColor = html.match(/name="theme-color"\s+content="(#[0-9a-fA-F]{6})"/)?.[1];
if (!themeColor) {
  failures.push("index.html has no theme-color meta tag");
} else {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(themeColor.slice(i, i + 2), 16) / 255);
  const linear = [r, g, b].map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const htmlLuminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const drift = Math.abs(htmlLuminance - luminance(paper));
  const ok = drift < 0.01;
  if (!ok) failures.push(`index.html theme-color ${themeColor} has drifted from --hp-paper`);
  console.log(`${ok ? "ok  " : "FAIL"} theme-color   drift ${drift.toFixed(4)} from --hp-paper`);
}

// The favicon data URI carries %23-prefixed hexes that must track the same two
// tokens; a favicon that drifts is the quietest colour drift of all.
const favicon = html.match(/rel="icon"[\s\S]*?href="data:image\/svg\+xml,([^"]+)"/)?.[1];
if (!favicon) {
  failures.push("index.html has no inline SVG favicon");
} else {
  const hexes = [...favicon.matchAll(/%23([0-9a-fA-F]{6})/g)].map((m) => `#${m[1].toLowerCase()}`);
  const ok = ["paper", "accent"].every((name) => hexes.includes(hexOf(token(name))));
  if (!ok) {
    failures.push(
      `favicon hexes ${hexes.join(" ")} do not match --hp-paper/--hp-accent (${hexOf(token("paper"))} ${hexOf(token("accent"))})`,
    );
  }
  console.log(
    `${ok ? "ok  " : "FAIL"} favicon       ${hexes.join(" ")} vs tokens ${hexOf(token("paper"))} ${hexOf(token("accent"))}`,
  );
}

if (failures.length) {
  console.error(`\n${failures.length} token failure(s):`);
  for (const failure of failures) console.error(`  · ${failure}`);
  process.exit(1);
}

console.log("\ntokens clean: colours locked, contrast floors met.");
