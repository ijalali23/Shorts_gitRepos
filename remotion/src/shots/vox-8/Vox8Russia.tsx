import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CollageBoard, Layer, StatCard, PaperBG, Grain, VOX } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { makeEqualEarthScale, EqualEarthWorldLayer, equalEarthCountryPath } from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox8Russia',
  durationInSeconds: 40,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);
const clampBoth = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// =============================================================================
// REAL DATA — see vox-shorts/vox-8-russia/script.md for full sourcing/verification.
// =============================================================================
const RUSSIA = WORLD.find((c) => c.name === 'Russia')!;
const RUSSIA_KM2 = RUSSIA.km2; // 16,927,109 — this repo's own Natural Earth figure

// European Russia (Wikipedia: "European Russia") is a real, independently-published region —
// area AND population share both sourced there, neither derived from the other.
const EUROPEAN_RUSSIA_KM2 = 3969100;
const PCT_LAND_EUROPEAN = Math.round((EUROPEAN_RUSSIA_KM2 / RUSSIA_KM2) * 1000) / 10; // ~23.5%
const POP_2026 = 143394458; // Worldometer, mid-year estimate
const POP_SHARE_EUROPEAN = 0.8; // Wikipedia, European Russia
const POP_EUROPEAN = Math.round(POP_2026 * POP_SHARE_EUROPEAN);
const POP_ASIAN = POP_2026 - POP_EUROPEAN;
const ASIAN_RUSSIA_KM2 = RUSSIA_KM2 - EUROPEAN_RUSSIA_KM2;
const ASIAN_DENSITY = Math.round((POP_ASIAN / ASIAN_RUSSIA_KM2) * 10) / 10; // ~2.2/km2
const NATIONAL_DENSITY = Math.round((POP_2026 / RUSSIA_KM2) * 10) / 10; // ~8.5/km2
const MONGOLIA_DENSITY = 2; // Worldometer 2026 — the world's least densely populated country

// =============================================================================
// PROJECTION — Equal Earth (not a Mercator-distortion story; same reasoning as EP02-05).
// =============================================================================
const CARD_W = 900;
const EQ_SCALE = makeEqualEarthScale({ x: 0, y: 0, w: CARD_W });
const CARD_H = EQ_SCALE.box.h;

const MAP_CARD = { x: 540, y: 700 };
const STAT_CARD = { x: 540, y: 2000 };
const CLOSING_CARD = { x: 540, y: 3100 };

// Chukotka's far-east tip is stored as separate rings using NEGATIVE longitudes near -180
// (geographically continuous with the rest of Russia, but on the opposite edge of any
// non-Russia-centered flat map — every standard atlas splits Russia this way; see script.md).
// Excluded here only for computing the hero shot's camera target — it still renders, in its
// correct (if visually separated) position, via the ordinary EqualEarthWorldLayer/path below.
const RUSSIA_MAIN_RINGS = RUSSIA.rings.filter((ring) => ring.every(([lon]) => lon >= 0));
const RUSSIA_MAIN_BBOX = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ring of RUSSIA_MAIN_RINGS) {
    for (const [lon, lat] of ring) {
      const [x, y] = EQ_SCALE.px(lon, lat);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return { minX, maxX, minY, maxY };
})();
const RUSSIA_MAIN_LAT = (() => {
  let sum = 0, n = 0;
  for (const ring of RUSSIA_MAIN_RINGS) for (const [, lat] of ring) { sum += lat; n++; }
  return sum / n;
})();

// Russia's real extent within the card (main landmass only, absolute board coordinates) — same
// computation method as EP04/EP05's CHINA_BOARD/EGYPT_BOARD, just keeping min/max as well as
// the center: a pan needs the edges, not just the middle.
const toBoardX = (cardLocalX: number) => MAP_CARD.x - CARD_W / 2 + cardLocalX;
const toBoardY = (cardLocalY: number) => MAP_CARD.y - CARD_H / 2 + cardLocalY;
const RUSSIA_MIN_X = toBoardX(RUSSIA_MAIN_BBOX.minX);
const RUSSIA_MAX_X = toBoardX(RUSSIA_MAIN_BBOX.maxX);
const RUSSIA_MIN_Y = toBoardY(RUSSIA_MAIN_BBOX.minY);
const RUSSIA_MAX_Y = toBoardY(RUSSIA_MAIN_BBOX.maxY);

// The card's own rendered edges (SVG height + MapCard's padding, same 3.5%-of-width formula
// MapCard itself uses) — the actual "don't expose blank paper past this" boundary.
const CARD_PAD = CARD_W * 0.035;
const CARD_TOP = MAP_CARD.y - CARD_H / 2 - CARD_PAD;
const CARD_BOTTOM = MAP_CARD.y + CARD_H / 2 + CARD_PAD;

// The valid vertical camera position at a given zoom that keeps Russia's FULL height in view
// AND stays inside the card's own edges — computed fresh per zoom, not copied from a different
// shot's solution (the bug caught in QA: y=700 was the right answer for z=4.0, but silently
// reused at z=6.0 where the math is different, cropping Russia almost entirely off-frame).
function safeCamY(zoom: number): number {
  const halfH = 1920 / (2 * zoom);
  const lo = Math.max(RUSSIA_MAX_Y - halfH, CARD_TOP + halfH);
  const hi = Math.min(RUSSIA_MIN_Y + halfH, CARD_BOTTOM - halfH);
  return (lo + hi) / 2;
}

// The Urals divide — anchored approximation, not an exact digitization (see script.md): a
// single vertical longitude, bisected by grid quadrature over Russia's own real silhouette
// until the area west of it matched the verified 3,969,100 km2 European-Russia figure exactly.
// Computed value: 60.5°E — reassuringly close to the real Ural Mountains' own longitude band.
const DIVIDE_LON = 60.5;
const DIVIDE_X = EQ_SCALE.px(DIVIDE_LON, RUSSIA_MAIN_LAT)[0]; // card-local — for the SVG clip rect
const DIVIDE_X_BOARD = toBoardX(DIVIDE_X); // absolute board coords — for the camera target below

// Russia's real shape (main landmass ~291x83 board units, a ~3.5:1 aspect ratio) is too wide
// and short to be both fully framed AND vertically centered on its own true position without
// exceeding the card's own height at any zoom that shows enough of its width (the India rule
// from EP02 can't be fully satisfied here — see script.md's "Camera framing" section for the
// full derivation). Rather than force a static, awkwardly-cropped compromise, the hook PANS
// across Russia's full east-west extent instead: a moving camera actually sells "this country
// is absurdly wide" better than a static frame, and sidesteps the centering problem entirely,
// since at any single instant the visible slice is a normal, well-framed width.
const PAN_Z = 6.0;
const PAN_Y = safeCamY(PAN_Z);
const PAN_HALF_W = 1080 / (2 * PAN_Z);
const PAN_START = { x: RUSSIA_MIN_X + PAN_HALF_W, y: PAN_Y, z: PAN_Z };
const PAN_END = { x: RUSSIA_MAX_X - PAN_HALF_W, y: PAN_Y, z: PAN_Z };
// Reveal/context/payoff settle on the Urals divide itself, a bit wider than the pan so both
// the highlighted west and the dimming east are visible at once around the boundary.
const SETTLE_Z = 4.5;
const SETTLE = { x: DIVIDE_X_BOARD, y: safeCamY(SETTLE_Z), z: SETTLE_Z };
const CAM_NUMBERS = { x: STAT_CARD.x, y: STAT_CARD.y, z: 1.0 };
const CAM_CLOSING = { x: CLOSING_CARD.x, y: CLOSING_CARD.y, z: 1.0 };

// Timed from vox-shorts/vox-8-russia/beats.json's SECOND (tight) gen_voice.py pass. No
// LabelChips this episode: the story is carried entirely by the pan and the map's own color
// animation (reveal + dim), sidestepping the whole "chip sized for the wrong zoom" class of
// bug rather than needing to compensate for it.
const CAM = [
  { f: 0, ...PAN_START },
  { f: F(6.3), ...PAN_END },
  { f: F(6.6), ...SETTLE },
  { f: F(16.3), ...SETTLE },
  { f: F(16.58), ...CAM_NUMBERS },
  { f: F(27.9), ...CAM_NUMBERS },
  { f: F(28.22), ...SETTLE },
  { f: F(34.6), ...SETTLE },
  { f: F(34.82), ...CAM_CLOSING },
  { f: F(38.6), ...CAM_CLOSING },
];

// Reveal beat: the area west of the Urals divide fades in, synced to "eighty percent of its
// people live on just one quarter of it."
const REVEAL_START = F(6.6);
const REVEAL_END = F(8.6);

// Context beat: Russia's own base fill dims (everywhere that ISN'T the highlighted western
// quarter reads as empty), synced to "Everything east of that is Siberia and the Far East."
const DIM_START = F(11.75);
const DIM_END = F(13.25);

const RussiaMap: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [REVEAL_START, REVEAL_END], [0, 1], clampBoth);
  const dim = interpolate(frame, [DIM_START, DIM_END], [1, 0.35], clampBoth);
  const russiaD = equalEarthCountryPath(EQ_SCALE, RUSSIA);
  return (
    <svg width={EQ_SCALE.box.w} height={CARD_H} style={{ display: 'block', background: '#141d29' }}>
      <defs>
        <clipPath id="russia-clip">
          <path d={russiaD} />
        </clipPath>
      </defs>
      <EqualEarthWorldLayer scale={EQ_SCALE} except={['Russia']} />
      <path d={russiaD} fill={VOX.yellow} opacity={dim} stroke={VOX.cream} strokeWidth={1} />
      <g clipPath="url(#russia-clip)">
        <rect x={0} y={0} width={DIVIDE_X} height={CARD_H} fill={VOX.teal} opacity={reveal} />
      </g>
      <path d={russiaD} fill="none" stroke={VOX.cream} strokeWidth={1.5} />
    </svg>
  );
};

const MapCard: React.FC<{ x: number; y: number; w: number; at?: number }> = ({ x, y, w, at = -30 }) => {
  const frame = useCurrentFrame();
  const p = Math.max(0, Math.min(1, (frame - at) / 20));
  if (frame < at) return null;
  return (
    <Layer x={x} y={y} w={w + w * 0.07} at={at} dur={20} enter="place" rotate={-1} depth={0.02}>
      <div style={{ background: VOX.cream, padding: w * 0.035, boxShadow: '0 20px 46px rgba(40,28,12,0.32)', opacity: interpolate(p, [0, 1], [0, 1]) }}>
        <RussiaMap />
      </div>
    </Layer>
  );
};

const NUMBERS_AT = F(16.58);
const PAYOFF_AT = F(28.22);
const CLOSING_AT = F(34.82);

const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= NUMBERS_AT && frame < PAYOFF_AT) return null;
  if (frame >= CLOSING_AT) return null; // the closing card carries its own text
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox8Russia: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        {/* h=4100, matching EP04/EP05 exactly: CLOSING_CARD/CAM_CLOSING are the same board
            position and zoom as those episodes, so the same PaperBG coverage check applies. */}
        <PaperBG w={1080} h={4100} />

        <MapCard x={MAP_CARD.x} y={MAP_CARD.y} w={CARD_W} at={-30} />

        <StatCard
          x={STAT_CARD.x}
          y={STAT_CARD.y}
          at={NUMBERS_AT + 6}
          kicker="Siberia & the Far East"
          big={`${ASIAN_DENSITY}/km²`}
          sub={`Almost the same as Mongolia (${MONGOLIA_DENSITY}/km²), the emptiest country on Earth. Russia's own national average: ${NATIONAL_DENSITY}/km² - and 80% of everyone lives on just ${PCT_LAND_EUROPEAN}% of the land.`}
        />

        <StatCard
          x={CLOSING_CARD.x}
          y={CLOSING_CARD.y}
          at={CLOSING_AT + 6}
          kicker="Your turn"
          big="Which country next?"
          sub="Drop your pick in the comments - that's the one we check next."
        />
      </CollageBoard>

      <Kicker text="SIZE LIES · EP06" at={-20} until={F(3)} />
      <Kicker text="RUSSIA" at={F(2.5)} until={NUMBERS_AT} />
      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox8Russia;
