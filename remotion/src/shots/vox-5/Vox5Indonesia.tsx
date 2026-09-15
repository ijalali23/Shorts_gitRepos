import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CollageBoard, Layer, LabelChip, StatCard, PaperBG, Grain, VOX, EASE_OUT } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { makeMapScale, WorldLayer, countryPath, movedPath, centroid, eastWestExtentKm, type Move, type Country } from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox5Indonesia',
  durationInSeconds: 28,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// =============================================================================
// REAL DATA — the width claim is computed, not typed in (see lib/map.tsx's
// eastWestExtentKm/greatCircleKm, added for this video but generic for any future one).
// =============================================================================
const INDONESIA = WORLD.find((c) => c.name === 'Indonesia')!;
const USA_FULL = WORLD.find((c) => c.name === 'United States of America')!;
// Mainland only (ring 0) — Hawaii/Alaska are separate rings in the data and would confuse
// both the on-screen shape and the "continental US" claim, which explicitly excludes them.
const USA_MAINLAND: Country = { ...USA_FULL, rings: [USA_FULL.rings[0]] };

const INDONESIA_KM = Math.round(eastWestExtentKm(INDONESIA.rings));
const USA_KM = Math.round(eastWestExtentKm(USA_MAINLAND.rings));
const DIFF_KM = INDONESIA_KM - USA_KM;
const DIFF_PCT = Math.round((INDONESIA_KM / USA_KM - 1) * 100);

// Carrying the US mainland's TRUE shape onto Indonesia's location — the exact
// true-size-preserving transport built for EP01's Greenland shrink, reused generically here.
const [INDO_LON, INDO_LAT] = centroid(INDONESIA);
const OVERLAY_MOVE: Move = { toLon: INDO_LON, toLat: INDO_LAT };

// =============================================================================
// PROJECTION — Mercator this time (see script.md: the transport math that honestly
// relocates the US shape while preserving true size only exists for this scale, and both
// regions compared sit near the equator, where Mercator's own distortion is minimal).
// =============================================================================
const CARD_W = 900;
const MERC_SCALE = makeMapScale([-180, 180], [-58, 85], { x: 0, y: 0, w: CARD_W });

const MERC_CARD = { x: 540, y: 700 };
const STAT_CARD = { x: 540, y: 2000 };

// Board positions computed the same way every prior vox-N did — from the actual projected
// coordinates, not eyeballed.
const INDONESIA_BOARD = { x: 840, y: 843 };
const USA_REAL_BOARD = { x: 313, y: 731 };
const OVERLAY_BOARD = { x: 835, y: 845 };

const CAM_HOOK = { x: INDONESIA_BOARD.x, y: INDONESIA_BOARD.y, z: 4.0 };
const CAM_WIDE = { x: 600, y: 790, z: 1.3 };
const CAM_OVERLAY = { x: OVERLAY_BOARD.x, y: OVERLAY_BOARD.y, z: 3.6 };
const CAM_NUMBERS = { x: STAT_CARD.x, y: STAT_CARD.y, z: 1.0 };

// Retimed for the continuous-narration two-pass fix — these boundaries match the SECOND,
// tight-timing gen_voice.py pass, not the loose estimate used only to read real durations.
const CAM = [
  { f: 0, ...CAM_HOOK },
  { f: F(3.5), ...CAM_HOOK },
  { f: F(3.95), ...CAM_WIDE },
  { f: F(9.4), ...CAM_WIDE },
  { f: F(9.86), ...CAM_OVERLAY },
  { f: F(11.6), ...CAM_OVERLAY },
  { f: F(12.05), ...CAM_NUMBERS },
  { f: F(18.6), ...CAM_NUMBERS },
  { f: F(19.01), ...CAM_HOOK },
  { f: F(26.5), ...CAM_HOOK },
];

// US mainland's real-geometry slide onto Indonesia: 0 (real position) -> 1 (overlaid), held,
// then reset back to 0 while the camera is on CAM_NUMBERS (map card off-screen) so the loop
// close at CAM_HOOK matches frame 0 exactly — same trick as EP01's Greenland reset.
const TRANSPORT_START = F(7.02);
const TRANSPORT_END = F(9.6);
const RESET_AT = F(15.0);
const RESET_DONE = F(15.5);

function transportT(frame: number): number {
  if (frame <= TRANSPORT_START) return 0;
  if (frame < TRANSPORT_END) return EASE_OUT((frame - TRANSPORT_START) / (TRANSPORT_END - TRANSPORT_START));
  if (frame < RESET_AT) return 1;
  if (frame < RESET_DONE) return 1 - (frame - RESET_AT) / (RESET_DONE - RESET_AT);
  return 0;
}

const WorldMap: React.FC = () => {
  const frame = useCurrentFrame();
  const t = transportT(frame);
  return (
    <svg width={MERC_SCALE.box.w} height={MERC_SCALE.box.h} style={{ display: 'block', background: '#141d29' }}>
      <WorldLayer scale={MERC_SCALE} except={['Indonesia', 'United States of America']} />
      <path d={countryPath(MERC_SCALE, INDONESIA)} fill={VOX.red} stroke={VOX.cream} strokeWidth={1} />
      {/* the real US mainland, always drawn — at t=0 it's in its real spot; sliding to t=1
          carries it (true size preserved) onto Indonesia's location */}
      <path
        d={movedPath(MERC_SCALE, USA_MAINLAND, OVERLAY_MOVE, t)}
        fill="none"
        stroke={VOX.yellow}
        strokeWidth={2.5}
        strokeDasharray={t > 0.02 ? '6 5' : undefined}
      />
      {t <= 0.02 ? <path d={countryPath(MERC_SCALE, USA_MAINLAND)} fill={VOX.yellow} opacity={0.85} stroke={VOX.cream} strokeWidth={1} /> : null}
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
        <WorldMap />
      </div>
    </Layer>
  );
};

const NUMBERS_AT = F(12.05);
const PAYOFF_AT = F(19.01);

const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= NUMBERS_AT && frame < PAYOFF_AT) return null;
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox5Indonesia: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        <PaperBG w={1080} h={2900} />

        <MapCard x={MERC_CARD.x} y={MERC_CARD.y} w={CARD_W} at={-30} />

        {/* x=370, not USA_REAL_BOARD.x (313): at 313 the chip's left edge fell almost off-frame
            under CAM_WIDE's pan (caught in QA) — 370 keeps it fully on screen, still reads as
            pointing at the real US. No "Indonesia" chip: it was sized for CAM_WIDE's mild zoom
            (1.3) but stays mounted (at=-20, always visible) through CAM_HOOK/CAM_OVERLAY's much
            tighter zooms (4.0/3.6), where a normal-sized chip renders enormous — the exact
            zoom-scaling pitfall documented in vox-4. VO + captions already name Indonesia in
            the first four seconds, so the chip wasn't adding identification, only breaking. */}
        <LabelChip text="The real US" x={370} y={USA_REAL_BOARD.y - 90} at={F(4.15)} accent={VOX.yellow} kickerColor={VOX.inkSoft} kicker="ITS ACTUAL SPOT" depth={0.03} />

        <StatCard
          x={STAT_CARD.x}
          y={STAT_CARD.y}
          at={NUMBERS_AT + 6}
          kicker="Indonesia · Sabang to Merauke"
          big={`${INDONESIA_KM.toLocaleString()} km`}
          sub={`vs ${USA_KM.toLocaleString()} km across the continental US — ${DIFF_KM.toLocaleString()} km (${DIFF_PCT}%) wider`}
        />
      </CollageBoard>

      <Kicker text="SIZE LIES · EP03" at={-20} until={F(3)} />
      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox5Indonesia;
