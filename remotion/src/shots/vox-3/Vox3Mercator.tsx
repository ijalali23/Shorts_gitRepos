import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  CollageBoard,
  Layer,
  LabelChip,
  SerifStatement,
  StatCard,
  PaperBG,
  Grain,
  VOX,
  EASE_OUT,
} from '../../lib/collage';
import { Captions } from '../../lib/shorts';
import {
  makeMapScale,
  makeEqualEarthScale,
  WorldLayer,
  EqualEarthWorldLayer,
  Graticule,
  countryPath,
  equalEarthCountryPath,
  movedPath,
  centroid,
  africaGreenlandRatio,
  type Move,
} from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox3Mercator',
  durationInSeconds: 45,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);

// =============================================================================
// REAL DATA — the same Natural Earth country set + km2 figures the map itself is drawn
// from. Africa is every WORLD country with cont==='Africa'; Greenland is looked up by name.
// =============================================================================
const AFRICA = WORLD.filter((c) => c.cont === 'Africa');
const AFRICA_NAMES = AFRICA.map((c) => c.name);
const GREENLAND = WORLD.find((c) => c.name === 'Greenland')!;
const RATIO = africaGreenlandRatio(); // ~13.65 — where "about 14 times" comes from
const RATIO_DISPLAY = `~${Math.round(RATIO)}X`;

// Carrying Greenland to the equator AT ITS OWN LONGITUDE — the same convention lib/map.tsx's
// own `inflation()` helper uses. The shrink that follows is computed, not keyframed.
const [GREENLAND_LON] = centroid(GREENLAND);
const EQUATOR_MOVE: Move = { toLon: GREENLAND_LON, toLat: 0 };

// =============================================================================
// PROJECTIONS — both real, both fit at ONE box width so a side-by-side comparison of the two
// cards is honest (Mercator's box is naturally taller: that height difference IS evidence of
// how much vertical space the projection burns stretching high latitudes).
// =============================================================================
const CARD_W = 900;
const MERC_SCALE = makeMapScale([-180, 180], [-58, 85], { x: 0, y: 0, w: CARD_W });
const EQ_SCALE = makeEqualEarthScale({ x: 0, y: 0, w: CARD_W });

// =============================================================================
// BOARD LAYOUT — three "pages" stacked far apart on the board; the camera travels between
// them rather than anything moving on its own (per DESIGN.md's "the camera is the narrator").
// =============================================================================
const MERC_CARD = { x: 540, y: 700 };
const STAT_CARD = { x: 540, y: 2100 };
const EQ_CARD = { x: 540, y: 3300 };

const CAM_HOOK = { x: 540, y: 700, z: 1.15 };
const CAM_SETUP = { x: 512, y: 733, z: 1.55 };
const CAM_WHY = { x: 540, y: 750, z: 1.3 };
const CAM_VOTE = { x: 540, y: 2100, z: 1.0 };
const CAM_PAYOFF = { x: 540, y: 3300, z: 1.3 };

const CAM = [
  { f: 0, ...CAM_HOOK },
  { f: F(6.8), ...CAM_HOOK },
  { f: F(7.6), ...CAM_SETUP },
  { f: F(11.8), ...CAM_SETUP },
  { f: F(12.5), ...CAM_WHY },
  { f: F(20.3), ...CAM_WHY },
  { f: F(20.7), ...CAM_VOTE },
  { f: F(36.4), ...CAM_VOTE },
  { f: F(36.7), ...CAM_PAYOFF },
  { f: F(43.2), ...CAM_PAYOFF },
  { f: F(44.0), ...CAM_HOOK },
  { f: 1349, ...CAM_HOOK },
];

// Greenland's real-geometry shrink: 0 (home, polar) -> 1 (carried to the equator) during the
// WHY beat, then reset back to 0 once the camera has moved on (invisible — the mercator card
// isn't in frame again until the loop-closing hook shot, which needs it back at frame-0 state).
const WHY_START = F(12.6);
const WHY_HOLD = F(19.5);
const RESET_AT = F(24);
const RESET_DONE = RESET_AT + 10;

const MercatorMap: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolateT(frame, [WHY_START, WHY_HOLD, RESET_AT, RESET_DONE], [0, 1, 1, 0]);
  return (
    <svg width={MERC_SCALE.box.w} height={MERC_SCALE.box.h} style={{ display: 'block', background: '#141d29' }}>
      <Graticule scale={MERC_SCALE} />
      <WorldLayer scale={MERC_SCALE} except={[...AFRICA_NAMES, 'Greenland']} />
      {AFRICA.map((c) => (
        <path key={c.name} d={countryPath(MERC_SCALE, c)} fill={VOX.teal} stroke={VOX.cream} strokeWidth={1} />
      ))}
      <path d={movedPath(MERC_SCALE, GREENLAND, EQUATOR_MOVE, t)} fill={VOX.red} stroke={VOX.cream} strokeWidth={1.5} />
    </svg>
  );
};

const EqualEarthMap: React.FC = () => (
  <svg width={EQ_SCALE.box.w} height={EQ_SCALE.box.h} style={{ display: 'block', background: '#141d29' }}>
    <EqualEarthWorldLayer scale={EQ_SCALE} except={[...AFRICA_NAMES, 'Greenland']} />
    {AFRICA.map((c) => (
      <path key={c.name} d={equalEarthCountryPath(EQ_SCALE, c)} fill={VOX.teal} stroke={VOX.cream} strokeWidth={1} />
    ))}
    <path d={equalEarthCountryPath(EQ_SCALE, GREENLAND)} fill={VOX.red} stroke={VOX.cream} strokeWidth={1.5} />
  </svg>
);

// Small monotonic-safe interpolate helper (frame breakpoints here are strictly increasing;
// values are not, which Remotion's own interpolate allows — only the input needs to be).
function interpolateT(frame: number, input: number[], output: number[]): number {
  if (frame <= input[0]) return output[0];
  if (frame >= input[input.length - 1]) return output[output.length - 1];
  for (let i = 0; i < input.length - 1; i++) {
    if (frame >= input[i] && frame <= input[i + 1]) {
      const p = (frame - input[i]) / Math.max(1, input[i + 1] - input[i]);
      const eased = p < 0 || p > 1 ? p : EASE_OUT(p);
      return output[i] + (output[i + 1] - output[i]) * eased;
    }
  }
  return output[output.length - 1];
}

// A "page" card: cream mat + shadow around a dark map SVG — the atlas-clipping look, per
// make-vox's collage language, but drawn from real computed geometry, not a photograph.
const MapCard: React.FC<{
  x: number;
  y: number;
  w: number;
  at?: number;
  rotate?: number;
  children: React.ReactNode;
}> = ({ x, y, w, at = -30, rotate = -1, children }) => (
  <Layer x={x} y={y} w={w + w * 0.07} at={at} dur={20} enter="place" rotate={rotate} depth={0.02}>
    <div style={{ background: VOX.cream, padding: w * 0.035, boxShadow: '0 20px 46px rgba(40,28,12,0.32)' }}>
      {children}
    </div>
  </Layer>
);

const CAVEAT_START = F(30.2);

const VoteStatGated: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= CAVEAT_START) return null;
  return (
    <StatCard
      x={STAT_CARD.x}
      y={STAT_CARD.y}
      at={F(20.9)}
      kicker="UN General Assembly · Sept 4, 2026"
      big="164–1"
      sub="votes to recommend a different map"
    />
  );
};

// The final caption line ("It's actually about fourteen times bigger") lands right as the
// "~14X BIGGER." SerifStatement reveal appears at the same screen height — caught in QA as a
// literal text-on-text collision. The statement already carries that exact line, so (same fix
// as vox-2's quote card) the redundant caption is hidden once the reveal appears rather than
// repositioned into an even less safe part of the frame.
const PAYOFF_REVEAL_AT = F(40.9);

const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= PAYOFF_REVEAL_AT) return null;
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox3Mercator: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        <PaperBG w={1080} h={4200} />

        {/* HOOK — pre-rolled so frame 0 is fully composed */}
        <SerifStatement
          words={[{ t: 'THIS' }, { t: 'MAP' }, { t: 'HAS' }, { t: 'BEEN' }, { t: 'LYING', hl: true }, { t: 'TO' }, { t: 'YOU.' }]}
          x={MERC_CARD.x}
          y={220}
          w={760}
          at={-40}
          size={56}
        />
        <MapCard x={MERC_CARD.x} y={MERC_CARD.y} w={CARD_W} at={-30}>
          <MercatorMap />
        </MapCard>
        <LabelChip text="Greenland" x={430} y={470} at={-20} accent={VOX.red} kicker="THE ARCTIC" depth={0.03} />
        {/* y=760, not the shape's own centroid (960): at 960 the chip lands inside the caption's
            safe-y band (1180-1380 screen) under both the SETUP and WHY camera zooms — caught in
            QA. 760 sits just above Africa's own northern tip, clear under every camera state
            that frames this card. */}
        <LabelChip text="Africa" x={620} y={760} at={-20} accent={VOX.teal} kicker="THE CONTINENT" depth={0.03} />

        {/* SETUP */}
        <LabelChip text="Same size?" x={512} y={700} at={F(7.9)} accent={VOX.yellow} kickerColor={VOX.inkSoft} kicker="LOOK AGAIN" depth={0.03} />

        {/* WHY — Greenland's real outline shrinks as MercatorMap carries it to the equator */}
        <LabelChip text="Mercator, 1569" x={790} y={520} at={F(13.2)} accent={VOX.red} kicker="BUILT FOR SAILORS" depth={0.03} />

        {/* VOTE / CAVEAT — same board position, gated by frame so one replaces the other */}
        <VoteStatGated />
        <StatCard
          x={STAT_CARD.x}
          y={STAT_CARD.y}
          at={CAVEAT_START + 6}
          kicker="Non-binding"
          big="No Borders Change"
          sub="Ships still use Mercator"
        />

        {/* PAYOFF / LOOP */}
        <MapCard x={EQ_CARD.x} y={EQ_CARD.y} w={CARD_W} at={F(36.8)}>
          <EqualEarthMap />
        </MapCard>
        {/* x offset -100, not -260: at -260 the chip's left edge fell off-screen under
            CAM_PAYOFF's zoom (caught in QA) — -100 keeps it fully on screen, still read as
            "above-left" of the card. */}
        <LabelChip text="Equal Earth, 2018" x={EQ_CARD.x - 100} y={EQ_CARD.y - 260} at={F(37.2)} accent={VOX.teal} kicker="TRUE RELATIVE SIZE" depth={0.03} />
        <SerifStatement
          words={[{ t: RATIO_DISPLAY, hl: true }, { t: 'BIGGER.' }]}
          x={EQ_CARD.x}
          y={EQ_CARD.y + 340}
          w={700}
          at={F(40.9)}
          size={72}
          backing
        />
      </CollageBoard>

      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox3Mercator;
