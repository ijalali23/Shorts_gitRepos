import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CollageBoard, Layer, StatCard, PaperBG, Grain, VOX } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { makeEqualEarthScale, EqualEarthWorldLayer, equalEarthCountryPath, type Country } from '../../lib/map';
import { WORLD } from '../../lib/geo/world';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox7Egypt',
  durationInSeconds: 42,
  fps: 30,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 30);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// =============================================================================
// REAL DATA — see vox-shorts/vox-7-egypt/script.md for full sourcing/verification.
// =============================================================================
const EGYPT = WORLD.find((c) => c.name === 'Egypt')!;
const EGYPT_KM2 = EGYPT.km2; // 998,994 — this repo's own Natural Earth figure, not typed in

// The Nile Delta + Valley corridor is a real, independently-published area (WWF/Wikipedia's
// "Nile Delta flooded savanna" ecoregion, ID PA0904: 51,138 km2) — but its exact boundary
// isn't in this repo's dataset, so the RING below is an anchored approximation: real waypoints
// along the Nile's course (Aswan, Luxor, Sohag, Asyut, Minya, Beni Suef, Cairo, then the
// Rosetta/Damietta river mouths for the delta fan), joined by a uniform corridor width that
// was the one tuned parameter — bisected until the ring's own computed area matched 51,138 km2
// exactly. Full derivation in script.md. On screen this is a real, area-verified shape, not an
// eyeballed line — but it's an approximation of the ecoregion's exact published boundary, and
// is labelled as illustrative (same standard as EP04's illustrative time-zone bands).
const NILE_AREA_KM2 = 51138;
const NILE_RING: [number, number][] = [
  [32.621, 24.062], [32.409, 25.613], [31.512, 26.411], [30.95, 27.072], [30.489, 28.103],
  [30.856, 29.121], [30.991, 30.069], [30.42, 31.4], [31.55, 31.62], [31.83, 31.52],
  [31.489, 30.011], [31.344, 29.019], [30.991, 28.117], [31.39, 27.288], [31.888, 26.709],
  [32.871, 25.787], [33.119, 24.118],
];
const NILE_SHAPE: Country = { name: 'Nile Corridor', cont: 'Africa', km2: NILE_AREA_KM2, rings: [NILE_RING] };

const PCT_LAND = Math.round((NILE_AREA_KM2 / EGYPT_KM2) * 1000) / 10; // ~5.1%
const POP_2026 = 120101175; // Wikipedia Egypt infobox, UN/Worldometer-derived
const POP_SHARE_IN_STRIP = 0.95; // Wikipedia "Demographics of Egypt" (see script.md)
const POP_IN_STRIP = Math.round(POP_2026 * POP_SHARE_IN_STRIP);
const STRIP_DENSITY = Math.round(POP_IN_STRIP / NILE_AREA_KM2); // ~2,231/km2
const NATIONAL_DENSITY = Math.round(POP_2026 / EGYPT_KM2); // ~120/km2
const DENSITY_RATIO = Math.round((STRIP_DENSITY / NATIONAL_DENSITY) * 10) / 10; // ~18.6x
const BANGLADESH_DENSITY = 1366; // Worldometer 2026
const BANGLADESH_RATIO = Math.round((STRIP_DENSITY / BANGLADESH_DENSITY) * 100) / 100; // ~1.63x

// =============================================================================
// PROJECTION — Equal Earth (not a Mercator-distortion story; same reasoning as EP02-04).
// =============================================================================
const CARD_W = 900;
const EQ_SCALE = makeEqualEarthScale({ x: 0, y: 0, w: CARD_W });
const CARD_H = EQ_SCALE.box.h;

const MAP_CARD = { x: 540, y: 700 };
const STAT_CARD = { x: 540, y: 2000 };
const CLOSING_CARD = { x: 540, y: 3100 };

// Egypt's real position within the card, computed from its Equal Earth bounding box (card-
// local center ~523,131 in a 900x438 card), offset by the card's own top-left — same method
// as EP04's CHINA_BOARD. Egypt is small on the world map, so this is the camera's tight-zoom
// target, not a loose "somewhere in there" guess.
const EGYPT_BOARD = { x: 613, y: 612 };

// z=18, not a moderate zoom: Egypt's own bounding box is tiny relative to the whole-world card
// (see script.md/QA), so a zoom in the 2-4x range used for larger countries (China, Indonesia)
// would leave Egypt looking like a speck surrounded by empty ocean — the OPPOSITE problem from
// EP04's blank-space bug, but the same root cause (zoom not matched to the subject's real size
// within the card). At z=18 the view is 60x107 board units, comfortably inside the card's own
// ~438x900 extent (no blank-paper risk at any zoom this tight), while Egypt's ~31x30 board-unit
// shape fills roughly half the frame width — checked with QA stills before final render.
const CAM_HOOK = { x: EGYPT_BOARD.x, y: EGYPT_BOARD.y, z: 18 };
const CAM_NUMBERS = { x: STAT_CARD.x, y: STAT_CARD.y, z: 1.0 };
const CAM_CLOSING = { x: CLOSING_CARD.x, y: CLOSING_CARD.y, z: 1.0 };

// Timed from vox-shorts/vox-7-egypt/beats.json's SECOND (tight) gen_voice.py pass — matches
// the continuous-narration two-pass fix every episode since EP03 has used. Retimed once more
// after line 1 ("reveal") was force-regenerated: its first ElevenLabs take had ~2.1s of real
// dead air baked into the audio after the last word (confirmed with `ffmpeg -af silencedetect`
// on the raw clip, not just the alignment metadata) — the exact class of bug the two-pass
// process's own silencedetect check exists to catch. A fresh take fixed it; every boundary
// below reflects the retimed beats.json, not the original take's numbers.
const CAM = [
  { f: 0, ...CAM_HOOK },
  { f: F(18.5), ...CAM_HOOK },
  { f: F(18.81), ...CAM_NUMBERS },
  { f: F(31.2), ...CAM_NUMBERS },
  { f: F(31.48), ...CAM_HOOK },
  { f: F(36.7), ...CAM_HOOK },
  { f: F(36.95), ...CAM_CLOSING },
  { f: F(41.5), ...CAM_CLOSING },
];

// Reveal beat: the Nile ribbon fades in on top of Egypt's outline, synced to the VO line that
// names it ("Ninety five percent... live right here").
const REVEAL_START = F(8.19);
const REVEAL_END = F(10.19);

// Context beat: Egypt's own fill dims (everywhere that ISN'T the ribbon reads as empty),
// synced to "Everywhere outside this ribbon is desert." The ribbon itself stays fully bright —
// only the base country fill fades.
const DIM_START = F(14.46);
const DIM_END = F(15.96);

const EgyptMap: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [REVEAL_START, REVEAL_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dim = interpolate(frame, [DIM_START, DIM_END], [1, 0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const egyptD = equalEarthCountryPath(EQ_SCALE, EGYPT);
  const nileD = equalEarthCountryPath(EQ_SCALE, NILE_SHAPE);
  return (
    <svg width={EQ_SCALE.box.w} height={CARD_H} style={{ display: 'block', background: '#141d29' }}>
      <EqualEarthWorldLayer scale={EQ_SCALE} except={['Egypt']} />
      <path d={egyptD} fill={VOX.yellow} opacity={dim} stroke={VOX.cream} strokeWidth={1} />
      <path d={nileD} fill={VOX.teal} opacity={reveal} stroke={VOX.cream} strokeWidth={1} />
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
        <EgyptMap />
      </div>
    </Layer>
  );
};

const NUMBERS_AT = F(18.81);
const PAYOFF_AT = F(31.48);
const CLOSING_AT = F(36.95);

const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= NUMBERS_AT && frame < PAYOFF_AT) return null;
  if (frame >= CLOSING_AT) return null; // the closing card carries its own text
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox7Egypt: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        {/* h=4100, matching EP04 exactly: CLOSING_CARD/CAM_CLOSING are the same board position
            and zoom as EP04's, so the same PaperBG coverage check applies unchanged. */}
        <PaperBG w={1080} h={4100} />

        <MapCard x={MAP_CARD.x} y={MAP_CARD.y} w={CARD_W} at={-30} />

        <StatCard
          x={STAT_CARD.x}
          y={STAT_CARD.y}
          at={NUMBERS_AT + 6}
          kicker="Egypt · where people actually live"
          big={`${STRIP_DENSITY.toLocaleString()}/km²`}
          sub={`vs ${NATIONAL_DENSITY}/km² nationwide. That's ${DENSITY_RATIO}x denser than the average suggests, and denser than Bangladesh (${BANGLADESH_DENSITY.toLocaleString()}/km²), the world's most crowded country.`}
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

      <Kicker text="SIZE LIES · EP05" at={-20} until={F(3)} />
      {/* "EGYPT" is named in the VO from line 2 (the reveal beat) onward, not the hook line
          itself ("This country is almost the size of..."), and a viewer with sound off or who
          tunes in a few seconds late has no other way to know which country this is until the
          numbers StatCard's kicker says "Egypt" much later. This screen-fixed label (immune to
          CAM_HOOK's 18x board-zoom, unlike a LabelChip) covers exactly that gap: it hands off to
          the series tag above and fades before the numbers beat, when the StatCard itself
          starts saying "Egypt" in text. */}
      <Kicker text="EGYPT" at={F(2.5)} until={NUMBERS_AT} />
      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox7Egypt;
