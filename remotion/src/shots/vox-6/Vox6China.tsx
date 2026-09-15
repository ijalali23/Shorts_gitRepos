import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CollageBoard, Layer, LabelChip, StatCard, PaperBG, Grain, VOX } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { makeEqualEarthScale, EqualEarthWorldLayer, equalEarthCountryPath, eastWestExtentKm, centroid, type Country } from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox6China',
  durationInSeconds: 43,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// =============================================================================
// REAL DATA
// =============================================================================
const CHINA = WORLD.find((c) => c.name === 'China')!;
const USA_FULL = WORLD.find((c) => c.name === 'United States of America')!;
const USA_MAINLAND: Country = { ...USA_FULL, rings: [USA_FULL.rings[0]] };

const CHINA_KM = Math.round(eastWestExtentKm(CHINA.rings));
const USA_KM = Math.round(eastWestExtentKm(USA_MAINLAND.rings));
const DIFF_KM = CHINA_KM - USA_KM;
const DIFF_PCT = Math.round((CHINA_KM / USA_KM - 1) * 100);

const CHINA_LONS = CHINA.rings.flat().map((p) => p[0]);
const CHINA_MIN_LON = Math.min(...CHINA_LONS);
const CHINA_MAX_LON = Math.max(...CHINA_LONS);
const [, CHINA_LAT] = centroid(CHINA);

// =============================================================================
// PROJECTION — Equal Earth (not a Mercator-distortion story; same reasoning as EP02/EP03).
// =============================================================================
const CARD_W = 900;
const EQ_SCALE = makeEqualEarthScale({ x: 0, y: 0, w: CARD_W });

// The map card's own center in board space (arbitrary, matches EP03/EP05's convention).
const MAP_CARD = { x: 540, y: 700 };
// Where China's silhouette actually sits within that card, in absolute board coordinates —
// computed from its Equal Earth bounding box (card-local center ~675,106 in a 900x438 card,
// offset by the card's own top-left). Used as the camera's x target and to place chips
// relative to China; NOT the card's own position (passing this as MapCard's own x/y was the
// actual bug caught in QA: it shifted the whole card, not just the camera).
const CHINA_BOARD = { x: 765, y: 587 };
const STAT_CARD = { x: 540, y: 2000 };
const CLOSING_CARD = { x: 540, y: 3100 };

// 5 illustrative bands across China's real longitude span (evenly divided for
// visualization — NOT the real 1918-1949 zone boundaries, which followed political/
// geographic lines. Computed from China's own real min/max longitude, not typed in.
const BAND_COUNT = 5;
const BAND_COLORS = ['#c0392b', '#c97b3d', '#33695d', '#4a6fa5', '#7a4a8f'];
const BAND_XS = Array.from({ length: BAND_COUNT + 1 }, (_, i) =>
  EQ_SCALE.px(CHINA_MIN_LON + ((CHINA_MAX_LON - CHINA_MIN_LON) * i) / BAND_COUNT, CHINA_LAT)[0],
);

// x=CHINA_BOARD.x (centers on China itself); y=MAP_CARD.y and z=4.0, not CHINA_BOARD.y/2.2:
// at z=2.2 the camera's vertical reach (1920/2.2 ≈ 872 board units) was roughly double the
// map card's own height (~438 + padding ≈ 501), so most of the frame — well above and below
// the card — showed raw PaperBG instead of map content (the blank-space bug the user
// flagged). z=4.0 (1920/4.0 = 480 board units) keeps the camera's reach inside the card's
// height, and matches EP03's own tightest zoom; centering vertically on the CARD's own
// middle (not China's higher-up position) is required for the math to work at any zoom this
// tight, since the card only has a few px of headroom either way.
const CAM_CHINA = { x: CHINA_BOARD.x, y: MAP_CARD.y, z: 4.0 };
const CAM_WIDE = { x: 558, y: 579, z: 1.5 };
const CAM_NUMBERS = { x: STAT_CARD.x, y: STAT_CARD.y, z: 1.0 };
const CAM_CLOSING = { x: CLOSING_CARD.x, y: CLOSING_CARD.y, z: 1.0 };

// Retimed for the continuous-narration two-pass fix (see script.md) — matches the SECOND,
// tight gen_voice.py pass, not the loose estimate used only to read real durations. No
// loop-back to the hook this time: the episode ends on the closing question card, not a repeat.
const CAM = [
  { f: 0, ...CAM_CHINA },
  { f: F(6.9), ...CAM_CHINA },
  { f: F(7.72), ...CAM_WIDE },
  { f: F(12.2), ...CAM_WIDE },
  { f: F(12.51), ...CAM_CHINA },
  { f: F(25.5), ...CAM_CHINA },
  { f: F(25.85), ...CAM_NUMBERS },
  { f: F(33.3), ...CAM_NUMBERS },
  { f: F(33.66), ...CAM_CHINA },
  { f: F(38.0), ...CAM_CHINA },
  { f: F(38.45), ...CAM_CLOSING },
  { f: F(42.5), ...CAM_CLOSING },
];

// The five bands fade under a solid "Beijing Time" yellow during the CONTEXT beat — a
// crossfade overlay clipped to China's own silhouette, not five separately-animated colors.
const UNIFY_START = F(8.3);
const UNIFY_END = F(11.8);

const ChinaMap: React.FC = () => {
  const frame = useCurrentFrame();
  const unify = interpolate(frame, [UNIFY_START, UNIFY_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const chinaD = equalEarthCountryPath(EQ_SCALE, CHINA);
  return (
    <svg width={EQ_SCALE.box.w} height={EQ_SCALE.box.h} style={{ display: 'block', background: '#141d29' }}>
      <defs>
        <clipPath id="china-clip">
          <path d={chinaD} />
        </clipPath>
      </defs>
      <EqualEarthWorldLayer scale={EQ_SCALE} except={['China', 'United States of America']} />
      <path d={equalEarthCountryPath(EQ_SCALE, USA_MAINLAND)} fill={VOX.teal} opacity={0.5} stroke={VOX.cream} strokeWidth={1} />
      <g clipPath="url(#china-clip)">
        {BAND_COLORS.map((color, i) => (
          <rect key={i} x={BAND_XS[i]} y={0} width={BAND_XS[i + 1] - BAND_XS[i]} height={EQ_SCALE.box.h} fill={color} />
        ))}
        <rect x={0} y={0} width={EQ_SCALE.box.w} height={EQ_SCALE.box.h} fill={VOX.yellow} opacity={unify} />
      </g>
      <path d={chinaD} fill="none" stroke={VOX.cream} strokeWidth={1.5} />
    </svg>
  );
};

const MapCard: React.FC<{ x: number; y: number; w: number; at?: number }> = ({ x, y, w, at = -30 }) => {
  const frame = useCurrentFrame();
  const p = clamp01((frame - at) / 20);
  if (frame < at) return null;
  return (
    <Layer x={x} y={y} w={w + w * 0.07} at={at} dur={20} enter="place" rotate={-1} depth={0.02}>
      <div style={{ background: VOX.cream, padding: w * 0.035, boxShadow: '0 20px 46px rgba(40,28,12,0.32)', opacity: interpolate(p, [0, 1], [0, 1]) }}>
        <ChinaMap />
      </div>
    </Layer>
  );
};

const NUMBERS_AT = F(25.85);
const PAYOFF_AT = F(33.66);
const CLOSING_AT = F(38.45);

const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= NUMBERS_AT && frame < PAYOFF_AT) return null;
  if (frame >= CLOSING_AT) return null; // the closing card carries its own text
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox6China: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        {/* h=4100, not a smaller "generous-looking" number: CAM_CLOSING (y=3100, z=1.0)
            reaches board y=4060 at its bottom edge — checked against PaperBG's own 5%-per-side
            overscan BEFORE rendering this time (h=3800 would only cover to 3990, exposing the
            raw background), per the lesson from every prior episode that skipped this check. */}
        <PaperBG w={1080} h={4100} />

        <MapCard x={MAP_CARD.x} y={MAP_CARD.y} w={CARD_W} at={-30} />

        {/* size=8, not the default 30: these render at CAM_CHINA's 4.0x zoom (raised from 2.2x
            to fix the blank-space-above-the-card bug), and a chip sized for the old zoom would
            now render roughly 1.8x too big on screen. 8 keeps the apparent size consistent with
            every other chip in the series (~size*zoom ≈ 30-32). y=500, not 440: 440 sat above
            the camera's new, much narrower vertical reach at this zoom and would render off the
            top of frame entirely (caught in QA after the reframe). */}
        <LabelChip text="Five zones become one" x={780} y={500} at={F(12.8)} accent={VOX.red} kicker="1949" size={8} depth={0.03} />
        {/* y=620 still sits inside the camera's new (narrower) vertical reach, so it's unchanged
            from before — only the size needed to follow the zoom change. Text stays short:
            the clock detail is already in the VO/kicker, so the chip doesn't need to repeat it. */}
        <LabelChip text="Sun sets after 10pm" x={740} y={620} at={F(20.6)} accent={VOX.teal} kicker="KASHGAR, FAR WEST" size={8} depth={0.03} />

        <StatCard
          x={STAT_CARD.x}
          y={STAT_CARD.y}
          at={NUMBERS_AT + 6}
          kicker="China · one official clock"
          big={`${CHINA_KM.toLocaleString()} km`}
          sub={`wide — vs ${USA_KM.toLocaleString()} km across the US, ${DIFF_KM.toLocaleString()} km (${DIFF_PCT}%) wider. The US still needs 4 time zones, Russia 11, China just 1`}
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

      <Kicker text="SIZE LIES · EP04" at={-20} until={F(3)} />
      {/* Added retroactively alongside vox-7-egypt's identical fix: a viewer with sound off or
          reading captions late has no on-screen country name until this. China's hook line
          happens to start with "China" itself, so this matters less here than in vox-7, but
          the series tag above was also missing (an oversight against SERIES.md's own
          convention) — both restored together for consistency across the series. */}
      <Kicker text="CHINA" at={F(2.5)} until={NUMBERS_AT} />
      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox6China;
