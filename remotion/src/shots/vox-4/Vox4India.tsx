import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CollageBoard, LabelChip, StatCard, PaperBG, Grain, VOX } from '../../lib/collage';
import { Captions } from '../../lib/shorts';
import { makeEqualEarthScale, EqualEarthWorldLayer, equalEarthCountryPath, areaRatio } from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox4India',
  durationInSeconds: 32,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);
const clamp = (t: number) => Math.max(0, Math.min(1, t));

// =============================================================================
// REAL DATA
// =============================================================================
const AMERICAS_OCEANIA_CONTS = ['North America', 'South America', 'Oceania'];
const isAmericasOceania = (c: { cont: string }) => AMERICAS_OCEANIA_CONTS.includes(c.cont);
const AMERICAS_OCEANIA = WORLD.filter(isAmericasOceania);
const INDIA = WORLD.find((c) => c.name === 'India')!;
// ~16.1x — three continents' land area against India's, computed live from the same real
// km2 data the map itself is drawn from (see lib/map.tsx's areaRatio/sumKm2).
const RATIO = areaRatio(isAmericasOceania, (c) => c.name === 'India');
const RATIO_DISPLAY = `~${Math.round(RATIO)}X`;

// =============================================================================
// PROJECTION — Equal Earth again (not Mercator): this video isn't about projection
// distortion (India sits too close to the equator for Mercator to meaningfully warp it),
// so leading with the accurate map is the honest choice, and a callback to vox-3's payoff.
// =============================================================================
const CARD_W = 900;
const EQ_SCALE = makeEqualEarthScale({ x: 0, y: 0, w: CARD_W });

const EQ_CARD = { x: 540, y: 900 };
const STAT_CARD = { x: 540, y: 2000 };

// India's real board position, computed the same way vox-3 computed Greenland/Africa's —
// not eyeballed. Card-local px + the card's own board offset (EQ_CARD - half the card size).
const INDIA_BOARD = { x: 740, y: 816 };

const CAM_HOOK = { x: INDIA_BOARD.x, y: INDIA_BOARD.y, z: 3.4 };
const CAM_WIDE = { x: EQ_CARD.x, y: EQ_CARD.y, z: 1.05 };
const CAM_NUMBERS = { x: STAT_CARD.x, y: STAT_CARD.y, z: 1.0 };

// Retimed for the "no pauses" fix (see script.md): these boundaries match the SECOND,
// tight-timing gen_voice.py pass (0.12s gaps off real per-line durations), not the loose
// 2.3-words/sec estimate used only to get that first, real-duration reading.
const CAM = [
  { f: 0, ...CAM_HOOK },
  { f: F(6.9), ...CAM_HOOK },
  { f: F(7.55), ...CAM_WIDE },
  { f: F(17.8), ...CAM_WIDE },
  { f: F(18.29), ...CAM_NUMBERS },
  { f: F(23.2), ...CAM_NUMBERS },
  { f: F(23.85), ...CAM_HOOK },
  { f: F(29.5), ...CAM_HOOK },
];

// The Americas+Oceania highlight fades IN on top of the already-visible muted base map at the
// "reveal" beat (those countries are never hidden/absent before that, just uncolored, so
// there's no hole in the map before the reveal), then fades back OUT before the camera
// returns to CAM_HOOK for the loop close — without this, the loop's last frame showed
// Australia still highlighted red, which frame 0 never had (caught in QA). The fade-out
// happens while CAM_NUMBERS holds on the StatCard, so it's never actually seen happening.
const AMERICAS_AT = F(7.55);
const AMERICAS_FADE_OUT_AT = F(22.3);

const WorldMap: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(
    frame,
    [AMERICAS_AT, AMERICAS_AT + 20, AMERICAS_FADE_OUT_AT, AMERICAS_FADE_OUT_AT + 20],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return (
    <svg width={EQ_SCALE.box.w} height={EQ_SCALE.box.h} style={{ display: 'block', background: '#141d29' }}>
      <EqualEarthWorldLayer scale={EQ_SCALE} except={['India']} />
      {AMERICAS_OCEANIA.map((c) => (
        <path key={c.name} d={equalEarthCountryPath(EQ_SCALE, c)} fill={VOX.red} opacity={op} stroke={VOX.cream} strokeWidth={1} />
      ))}
      <path d={equalEarthCountryPath(EQ_SCALE, INDIA)} fill={VOX.yellow} stroke={VOX.cream} strokeWidth={1.5} />
    </svg>
  );
};

const MapCard: React.FC<{ x: number; y: number; w: number; at?: number }> = ({ x, y, w, at = -30 }) => {
  const frame = useCurrentFrame();
  const p = clamp((frame - at) / 20);
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [1.06, 1])})`,
        opacity: interpolate(p, [0, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        background: VOX.cream,
        padding: w * 0.035,
        boxShadow: '0 20px 46px rgba(40,28,12,0.32)',
      }}
    >
      <WorldMap />
    </div>
  );
};

const NUMBERS_AT = F(18.29);
const PAYOFF_AT = F(23.85);
const LAND_CHIP_HIDE_AT = F(17.5);

// The "~16X more land" chip is sized for CAM_WIDE's zoom (1.05) and reads as a tiny sliver
// off in board-space once the camera returns to CAM_HOOK's tight 3.4x zoom for the loop close
// (its board position sits just outside that zoom's edge) — caught in QA as a stray label
// corner poking into the final frame. Hidden once CAM_WIDE's own beat ends, well before the
// camera starts moving away from it.
const LandChipGated: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= LAND_CHIP_HIDE_AT) return null;
  return <LabelChip text={`${RATIO_DISPLAY} more land`} x={540} y={700} at={F(11.0)} accent={VOX.red} kicker="THREE CONTINENTS" depth={0.03} />;
};

// The numbers beat's StatCard carries the population reveal in full text, so the caption
// track is hidden for the short window it's on screen at CAM_NUMBERS zoom (1.0) — the same
// redundant-text fix vox-2 and vox-3 both needed for their own reveal cards.
const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= NUMBERS_AT && frame < PAYOFF_AT) return null;
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox4India: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        {/* h=3000, not the seemingly-generous 2600: CAM_NUMBERS (y=2000, z=1.0) reaches board
            y=2960 at its bottom edge, past PaperBG's own 5%-per-side overscan on a 2600-tall
            board (covers only to 2730) — exposed the raw AbsoluteFill background at the very
            bottom of the numbers-beat frame (caught in QA). 3000 covers the actual reach with
            margin, same fix vox-2 needed for this exact bug. */}
        <PaperBG w={1080} h={3000} />

        <MapCard x={EQ_CARD.x} y={EQ_CARD.y} w={CARD_W} at={-30} />

        {/* CAM_WIDE-only annotation — sized for zoom~1.05, matching every other vox chip.
            Deliberately no chip during the CAM_HOOK/payoff tight zoom (3.4x): a normal-sized
            chip there would need board-space sizing an order of magnitude smaller, and the
            close-up reads cleanly on the highlighted shape + captions alone. */}
        <LandChipGated />

        <StatCard
          x={STAT_CARD.x}
          y={STAT_CARD.y}
          at={NUMBERS_AT + 6}
          kicker="India, 2026"
          big="1.48B"
          sub="vs ~1.10B across North America, South America & Oceania combined"
        />
      </CollageBoard>

      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox4India;
