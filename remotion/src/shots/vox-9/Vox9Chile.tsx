import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CollageBoard, Layer, Grain, VOX } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { DarkPaperBG, TapeStrip, Crosshair, ChevronStack, DossierLabel, DOSSIER } from '../../lib/collage-dossier';
import { makeEqualEarthScale, EqualEarthWorldLayer, equalEarthCountryPath } from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG — 10s HOOK+REVEAL TEST ONLY, dossier visual skin. Not a
// full episode yet: see vox-shorts/vox-9-chile/beats.json "facts.status". If
// approved, the remaining beats (context/numbers/payoff/closing — southern
// ice-field contrast) get built the same way as every prior episode.
// =============================================================================
export const compositionConfig = {
  id: 'Vox9Chile',
  durationInSeconds: 13.6,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);
const clampBoth = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// =============================================================================
// REAL DATA — see vox-shorts/vox-9-chile/beats.json "facts" for sourcing; full
// script.md with primary-source citations to follow once this test is approved.
// =============================================================================
const CHILE = WORLD.find((c) => c.name === 'Chile')!;
const CHILE_LENGTH_KM = 4270; // Wikipedia, Geography of Chile (N-S extent)
const CHILE_AVG_WIDTH_KM = 177; // Wikipedia, Geography of Chile

// The Atacama Desert's commonly-cited latitude band (~18°S to 27°S) — an anchored
// approximation using a real, independently-published range, same discipline as EP06's
// Urals divide longitude; needs a primary-source confirmation pass before the full
// episode locks this boundary (see beats.json).
const ATACAMA_LAT_NORTH = -17.5;
const ATACAMA_LAT_SOUTH = -27.0;

// =============================================================================
// PROJECTION — Equal Earth (not a Mercator-distortion story; same reasoning as EP02-06).
// =============================================================================
const CARD_W = 900;
const EQ_SCALE = makeEqualEarthScale({ x: 0, y: 0, w: CARD_W });
const CARD_H = EQ_SCALE.box.h;
const MAP_CARD = { x: 540, y: 760 };

const toBoardX = (cardLocalX: number) => MAP_CARD.x - CARD_W / 2 + cardLocalX;
const toBoardY = (cardLocalY: number) => MAP_CARD.y - CARD_H / 2 + cardLocalY;

// Chile's real extent within the card, absolute board coordinates — same method as every
// prior episode's <Country>_BOARD computation (EP04 China, EP06 Russia, etc.).
const CHILE_BBOX = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ring of CHILE.rings) {
    for (const [lon, lat] of ring) {
      const [x, y] = EQ_SCALE.px(lon, lat);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return { minX, maxX, minY, maxY };
})();
const CHILE_MIN_X = toBoardX(CHILE_BBOX.minX);
const CHILE_MAX_X = toBoardX(CHILE_BBOX.maxX);
const CHILE_MIN_Y = toBoardY(CHILE_BBOX.minY); // northern tip (smaller Y = higher on screen)
const CHILE_MAX_Y = toBoardY(CHILE_BBOX.maxY); // southern tip

// The card's own rendered edges — the real "don't expose blank paper past this" boundary.
const CARD_PAD = CARD_W * 0.035;
const CARD_LEFT = MAP_CARD.x - CARD_W / 2 - CARD_PAD;
const CARD_RIGHT = MAP_CARD.x + CARD_W / 2 + CARD_PAD;

// Chile is the mirror-image problem to EP06/Russia: extremely TALL and narrow instead of wide
// and short, so the hero shot pans VERTICALLY (south to north) instead of horizontally. The
// horizontal position at any zoom is the one that keeps a given X-range in view without
// exceeding the card's own left/right edges — computed fresh per zoom AND per region, same
// safeCamY(zoom) pattern from EP06's script.md, mirrored onto X. Takes explicit bounds (not a
// single hardcoded "Chile's own" range) because Chile's coastline curves enough that the whole-
// country bbox center is the WRONG center once zoomed into one specific latitude band — the
// Atacama sits at the eastern edge of Chile's overall X-range, not its middle (caught in QA:
// centering the tight reveal zoom on the whole-country average pushed the desert off the left
// edge of frame).
function safeCamX(zoom: number, minX: number, maxX: number): number {
  const halfW = 1080 / (2 * zoom);
  const lo = Math.max(maxX - halfW, CARD_LEFT + halfW);
  const hi = Math.min(minX + halfW, CARD_RIGHT - halfW);
  return (lo + hi) / 2;
}

// Chile's own board shape is tiny relative to the world card (~33 wide x ~108 tall, out of a
// 900-wide card) — nowhere near Russia's ~291x83, so it needs a MUCH higher zoom to fill the
// frame at all; this is the mirror lesson to EP06's script.md: never carry a zoom number from
// a differently-shaped country, recompute for this one's actual board size every time.
const PAN_Z = 28;
const PAN_HALF_H = 1920 / (2 * PAN_Z);
const PAN_X = safeCamX(PAN_Z, CHILE_MIN_X, CHILE_MAX_X);
const PAN_SOUTH = { x: PAN_X, y: CHILE_MAX_Y - PAN_HALF_H, z: PAN_Z };
const PAN_NORTH = { x: PAN_X, y: CHILE_MIN_Y + PAN_HALF_H, z: PAN_Z };

// Reveal settles tighter on the Atacama band at Chile's northern tip — its OWN local X-range,
// not the whole country's (see safeCamX's comment above for why that distinction matters here).
const ATACAMA_BAND_BBOX = (() => {
  let minX = Infinity, maxX = -Infinity;
  for (const ring of CHILE.rings) {
    for (const [lon, lat] of ring) {
      if (lat <= ATACAMA_LAT_NORTH && lat >= ATACAMA_LAT_SOUTH) {
        const [x] = EQ_SCALE.px(lon, lat);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }
  return { minX, maxX };
})();
const ATACAMA_MIN_X = toBoardX(ATACAMA_BAND_BBOX.minX);
const ATACAMA_MAX_X = toBoardX(ATACAMA_BAND_BBOX.maxX);
const ATACAMA_Y_NORTH = toBoardY(EQ_SCALE.px(-69, ATACAMA_LAT_NORTH)[1]);
const ATACAMA_Y_SOUTH = toBoardY(EQ_SCALE.px(-69, ATACAMA_LAT_SOUTH)[1]);
const ATACAMA_Y_MID = (ATACAMA_Y_NORTH + ATACAMA_Y_SOUTH) / 2;
const SETTLE_Z = 32;
const SETTLE = { x: safeCamX(SETTLE_Z, ATACAMA_MIN_X, ATACAMA_MAX_X), y: ATACAMA_Y_MID, z: SETTLE_Z };

const HOOK_END = F(7.95);
const REVEAL_START = F(8.02);
const REVEAL_END = F(9.6);

const CAM = [
  { f: 0, ...PAN_SOUTH },
  { f: HOOK_END, ...PAN_NORTH },
  { f: HOOK_END + F(0.3), ...SETTLE },
  { f: F(13.6), ...SETTLE },
];

const ChileMap: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [REVEAL_START, REVEAL_END], [0, 1], clampBoth);
  const chileD = equalEarthCountryPath(EQ_SCALE, CHILE);
  const bandTopLocal = EQ_SCALE.px(-69, ATACAMA_LAT_NORTH)[1];
  const bandHeightLocal = EQ_SCALE.px(-69, ATACAMA_LAT_SOUTH)[1] - bandTopLocal;
  return (
    <svg width={EQ_SCALE.box.w} height={CARD_H} style={{ display: 'block', background: '#141d29' }}>
      <defs>
        <clipPath id="chile-clip">
          <path d={chileD} />
        </clipPath>
      </defs>
      <EqualEarthWorldLayer scale={EQ_SCALE} except={['Chile']} />
      <path d={chileD} fill={VOX.cream} opacity={0.9} stroke={VOX.cream} strokeWidth={1} />
      <g clipPath="url(#chile-clip)">
        <rect x={0} y={bandTopLocal} width={EQ_SCALE.box.w} height={bandHeightLocal} fill={DOSSIER.yellow} opacity={reveal} />
      </g>
      <path d={chileD} fill="none" stroke={VOX.ink} strokeWidth={1.5} />
    </svg>
  );
};

const MapCard: React.FC<{ x: number; y: number; w: number; at?: number }> = ({ x, y, w, at = -20 }) => {
  const frame = useCurrentFrame();
  const p = Math.max(0, Math.min(1, (frame - at) / 20));
  if (frame < at) return null;
  return (
    <Layer x={x} y={y} w={w + w * 0.07} at={at} dur={20} enter="place" rotate={-1} depth={0.02}>
      <div style={{ position: 'relative' }}>
        <div style={{ background: VOX.cream, padding: w * 0.035, boxShadow: '0 20px 46px rgba(0,0,0,0.5)', opacity: p }}>
          <ChileMap />
        </div>
        <TapeStrip x={w * 0.14} y={-w * 0.01} rotate={-9} z={5} />
        <TapeStrip x={w * 0.86} y={-w * 0.01} rotate={8} z={5} />
      </div>
    </Layer>
  );
};

// Dossier decoration (grid ground, corner crosshairs, chevrons) is screen-space HUD chrome,
// NOT board content — at PAN_Z/SETTLE_Z this tight, anything placed as board-space children of
// CollageBoard gets the same 28x-50x scale as the map itself and flies miles off-canvas. Same
// reasoning as SERIES.md's "no LabelChip during a tight hero-shot zoom" rule for EP04-06: fixed
// screen position, not a board coordinate, is what actually reads as a steady on-screen overlay.
const Vox9Chile: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: DOSSIER.black }}>
      <DarkPaperBG w={1080} h={1920} />
      <Crosshair x={90} y={150} z={3} />
      <Crosshair x={990} y={150} variant="target" z={3} />
      <Crosshair x={90} y={1820} variant="target" z={3} />
      <Crosshair x={990} y={1820} z={3} />
      <ChevronStack x={130} y={960} count={5} z={3} />

      <CollageBoard cam={CAM}>
        <MapCard x={MAP_CARD.x} y={MAP_CARD.y} w={CARD_W} at={-20} />
      </CollageBoard>

      <DossierLabel kicker="THE ATACAMA" text="NO RAIN IN DECADES" x={540} y={330} at={REVEAL_START} size={38} align="center" z={8} />

      <Kicker text="SIZE LIES · EP07" at={-20} until={F(3)} />
      <Kicker text="CHILE" at={F(2.5)} until={F(13.6)} />
      <Captions lines={VO} accent={DOSSIER.yellow} plate />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

export default Vox9Chile;
