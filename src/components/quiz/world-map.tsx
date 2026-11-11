'use client';

import type { FunderHighlight } from './types';
import { WORLD_LAND_PATHS } from './world-map-paths';

/* ------------------------------------------------------------------ */
/* World map with money bubbles — quiz interstitial                     */
/*                                                                     */
/* The landmass is a flat silhouette from a public-domain Natural      */
/* Earth-derived dataset (see world-map-paths.ts): one fill, no        */
/* internal borders, no labels. Bubbles are driven ONLY by the live    */
/* stats payload (real funder names + real max amounts) — never        */
/* hard-coded, so the bubbles, the chips below and the counts line     */
/* can never drift apart. If the payload is empty, the parent renders  */
/* no map at all.                                                      */
/*                                                                     */
/* Sizing is in % of the map width (never fixed px), so the layout     */
/* stays balanced on desktop and mobile: bubble diameters, the         */
/* de-collision math and the font sizes (cqw units) all scale with     */
/* the container.                                                      */
/* ------------------------------------------------------------------ */

// Equirectangular projection, viewBox 0 0 1000 500.
function lonLatToPct(lon: number, lat: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

/**
 * Funder HQ region, by funder name (normalised key). Coordinates are the
 * funder's head-office CITY taken from the seed data (hq_country) and the
 * funder's own published location — region-level only, not exact pins, so
 * funders sharing a metro area (Bay Area, Boston, DC, New York) are given
 * slightly spread anchor points within that same metro area. That keeps
 * bubbles roughly over the right region while giving the de-collision
 * pass separated starting points. Funders whose HQ city is not recorded
 * are placed over the region their grants serve instead (see FALLBACK).
 */
const FUNDER_REGIONS: Record<string, { lon: number; lat: number; short: string }> = {
  // key: funder name lower-cased, punctuation stripped
  dprize: { lon: -122.4, lat: 37.8, short: 'D-PRIZE' }, // San Francisco, US
  thepollinationproject: { lon: -121.9, lat: 38.2, short: 'TPP' }, // Bay Area (Oakland), US
  awesomefoundation: { lon: -71.1, lat: 42.4, short: 'AWESOME' }, // Boston, US
  globalinnovationfund: { lon: -0.1, lat: 51.5, short: 'GIF' }, // London, UK
  conservationfoodhealthfoundation: { lon: -70.2, lat: 43.1, short: 'CFH' }, // New England, US
  nationalendowmentfordemocracy: { lon: -77.0, lat: 38.9, short: 'NED' }, // Washington DC, US
  gefsmallgrantsprogramme: { lon: -74.0, lat: 40.7, short: 'GEF SGP' }, // New York (UNDP), US
  echoinggreen: { lon: -73.5, lat: 41.0, short: 'EG' }, // New York metro, US
  cartierwomensinitiative: { lon: 2.35, lat: 48.86, short: 'CARTIER' }, // Paris, France
  draperrichardskaplanfoundation: { lon: -122.0, lat: 37.2, short: 'DRK' }, // Bay Area (San Jose), US
  tonyelumelufoundation: { lon: 3.4, lat: 6.5, short: 'TEF' }, // Lagos, Nigeria
  africanwomensdevelopmentfund: { lon: -0.2, lat: 5.6, short: 'AWDF' }, // Accra, Ghana
  usafricandevelopmentfoundation: { lon: -76.0, lat: 39.3, short: 'USADF' }, // DC metro (Baltimore), US
  urgentactionfundafrica: { lon: 36.8, lat: -1.3, short: 'UAF' }, // Nairobi, Kenya
  embassyofjapaninnigeria: { lon: 7.5, lat: 9.1, short: 'GGP' }, // Abuja, Nigeria
  australiangovernmentdepartmentofforeignaffairsandtrade: { lon: 149.1, lat: -35.3, short: 'DFAT' }, // Canberra, Australia
  mastercardfoundation: { lon: -79.4, lat: 43.7, short: 'MCF' }, // Toronto, Canada
  segalfamilyfoundation: { lon: 36.8, lat: 0.5, short: 'SEGAL' }, // region served: East Africa
  vitolfoundation: { lon: 6.14, lat: 46.2, short: 'VITOL' }, // Geneva, Switzerland
};

// Unknown funder → the region the grants serve; GrantBridge serves Africa.
const FALLBACK_REGION = { lon: 20, lat: 2 };

function normalise(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function regionFor(h: FunderHighlight): { lon: number; lat: number; short: string } {
  const name = h.funderName ?? h.title;
  const key = normalise(name);
  if (FUNDER_REGIONS[key]) return FUNDER_REGIONS[key];
  // Substring match (covers "Global Innovation Fund — Core Innovation Fund"
  // style titles when the funder name itself is missing).
  const haystack = normalise(`${h.funderName ?? ''} ${h.title}`);
  for (const [k, v] of Object.entries(FUNDER_REGIONS)) {
    if (haystack.includes(k)) return v;
  }
  return { ...FALLBACK_REGION, short: shortName(name) };
}

const STOP_WORDS = new Set([
  'the', 'of', 'for', 'and', 'in', 'foundation', 'fund', 'programme', 'program',
  'grants', 'grant', 'initiative', 'department', 'affairs', 'trade', 'foreign',
  'government', 'embassy', 'us', 'u', 's',
]);

/** Short label for a bubble: initials of the meaningful words, upper-case. */
function shortName(name: string): string {
  const words = name
    .replace(/[^A-Za-z ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 10).toUpperCase();
  const initials = words.map((w) => w[0].toUpperCase()).join('');
  return initials.length > 1 ? initials.slice(0, 8) : words[0].slice(0, 10).toUpperCase();
}

/** "$15,000,000" → "$15M"; "$300,000" → "$300K"; "$1,000" → "$1K". */
function shortAmount(usd: number): string {
  const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  if (usd >= 1_000_000) return `$${trim(usd / 1_000_000)}M`;
  if (usd >= 1_000) return `$${trim(usd / 1_000)}K`;
  return `$${usd.toLocaleString()}`;
}

/**
 * Bubble diameter as % of the map width, log-scaled by amount so $15M
 * reads bigger than $1K without swallowing the map. The smallest bubbles
 * are too small for a readable name, so they show the amount only.
 */
function bubbleSizePct(usd: number): number {
  const size = 5.5 + 0.9 * Math.log10(Math.max(usd, 1000) / 1000);
  return Math.round(Math.min(8.8, Math.max(5.5, size)) * 10) / 10;
}

type PlacedBubble = {
  id: string;
  x: number; // % of map width
  y: number; // % of map height
  size: number; // diameter, % of map width
  amount: string;
  label: string;
};

/**
 * Place bubbles over the map, largest first. Bubbles that would overlap
 * are nudged to the nearest free spot on a deterministic spiral — no
 * randomness, so the layout is stable between renders. Overlap is
 * forbidden outright (full clearance plus a small gap), so bubbles never
 * touch or stack. Radii are in % units: rx is half the diameter in
 * width-%, ry is the diameter in height-% (the map is 2:1, so 1% of
 * width = 2% of height). Candidates are clamped so no bubble is cut off
 * at the map's edge.
 */
function placeBubbles(highlights: FunderHighlight[]): PlacedBubble[] {
  const placed: PlacedBubble[] = [];
  const sorted = [...highlights].sort(
    (a, b) => (b.amount_usd_max ?? 0) - (a.amount_usd_max ?? 0),
  );
  for (const h of sorted) {
    const amount = h.amount_usd_max ?? h.amount_usd_min ?? 0;
    if (amount <= 0) continue;
    const region = regionFor(h);
    const base = lonLatToPct(region.lon, region.lat);
    const size = bubbleSizePct(amount);
    const bubble: PlacedBubble = {
      id: h.id,
      x: base.x,
      y: base.y,
      size,
      amount: shortAmount(amount),
      label: region.short,
    };
    const rx = size / 2;
    const ry = size;
    const GAP = 0.5;
    const overlaps = (x: number, y: number) =>
      placed.some((p) => {
        const prx = p.size / 2;
        const pry = p.size;
        return Math.abs(x - p.x) < rx + prx + GAP && Math.abs(y - p.y) < ry + pry + GAP;
      });
    const clampX = (x: number) => Math.min(99 - rx, Math.max(1 + rx, x));
    const clampY = (y: number) => Math.min(99 - ry, Math.max(1 + ry, y));
    bubble.x = clampX(bubble.x);
    bubble.y = clampY(bubble.y);
    if (overlaps(bubble.x, bubble.y)) {
      let found = false;
      outer: for (const r of [4, 6, 8, 11, 14, 18, 22, 27, 33]) {
        for (let a = 0; a < 12; a++) {
          const angle = (a / 12) * Math.PI * 2;
          const x = clampX(base.x + Math.cos(angle) * r);
          const y = clampY(base.y + Math.sin(angle) * r * 1.4);
          if (!overlaps(x, y)) {
            bubble.x = x;
            bubble.y = y;
            found = true;
            break outer;
          }
        }
      }
      if (!found) continue; // no free spot — skip rather than stack bubbles
    }
    placed.push(bubble);
  }
  return placed;
}

export function WorldMap({ highlights }: { highlights: FunderHighlight[] }) {
  const bubbles = placeBubbles(highlights.slice(0, 10));
  return (
    <div
      className='relative aspect-[2/1] w-full overflow-hidden'
      style={{ containerType: 'inline-size' }}
      role='img'
      aria-label='World map showing where the largest open grants come from'
    >
      <svg
        viewBox='0 0 1000 500'
        className='absolute inset-0 h-full w-full'
        preserveAspectRatio='xMidYMid meet'
        aria-hidden
      >
        {WORLD_LAND_PATHS.map((d, i) => (
          <path key={i} d={d} fill='#D9EBDE' stroke='#D9EBDE' strokeWidth='1' strokeLinejoin='round' />
        ))}
      </svg>
      {bubbles.map((b, i) => (
        <div
          key={b.id}
          aria-hidden
          className='absolute'
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}%`,
            aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className='bubble-pop flex h-full w-full flex-col items-center justify-center rounded-full border-[1.5px] border-brand-green bg-white text-center shadow-md'
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className='font-bold leading-none text-brand-ink'
              style={{ fontSize: `max(9px, ${(b.size * 0.3).toFixed(2)}cqw)` }}
            >
              {b.amount}
            </span>
            {b.size >= 6.2 && (
              <span
                className='max-w-full truncate font-semibold uppercase text-brand-muted'
                style={{ fontSize: `max(6px, ${(b.size * 0.19).toFixed(2)}cqw)` }}
              >
                {b.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
