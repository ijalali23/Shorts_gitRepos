import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame } from 'remotion';
import {
  CollageBoard,
  Cutout,
  Grain,
  LabelChip,
  PaperBG,
  SerifStatement,
  VOX,
  EASE_OUT,
} from '../../lib/collage';
import { Captions, prog } from '../../lib/shorts';
import { FONT_BODY, FONT_EDITORIAL } from '../../fonts';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Vox2Decagon',
  durationInSeconds: 45,
  fps: 30,
  width: 1080,
  height: 1920,
};

const asset = (f: string) => staticFile(`projects/vox-2-decagon/layers/${f}`);
const F = (s: number) => Math.round(s * 30);

// =============================================================================
// CAMERA ANCHORS — named so every layer/chip positioned "near" a beat can be
// keyed off the same coordinates the camera itself uses (see DESIGN.md's "the
// camera is a narrator": layers are placed in BOARD space and the camera's own
// movement is what shows/hides them — no manual opacity toggling needed for
// the hook title or the discovery chips).
// =============================================================================
const CAM_HOOK = { x: 350, y: 750, z: 1.5 };
const CAM_DISC = { x: 730, y: 750, z: 1.5 };
// z=1.0 (not the wider 0.82 first tried): PaperBG only overscans the canvas by 10%, and at
// 0.82 the visible board area exceeded that margin, showing the raw AbsoluteFill background
// color at the top edge (caught in QA at frame 615) — z=1.0 stays inside the safe margin
// while still reading as a real pull-back from DISCOVERY's 1.5x.
const CAM_WIDE = { x: 540, y: 880, z: 1.0 };
// y=1620, not 1450: CAM_HOOK's own visible range reaches down to y=1390 (750 + 1920/(2*1.5)),
// and the quote card (centered here, ~440px tall) reached up to y≈1231 at 1450 — its top
// edge bled into the settled hook frame at the end, crowding the citation chip (caught in
// QA at the final/loop frame). 1620 keeps the card's top comfortably below 1390.
const CAM_QUOTE = { x: 540, y: 1620, z: 1.05 };

const CAM = [
  { f: 0, ...CAM_HOOK },
  { f: 300, ...CAM_HOOK },
  { f: 345, ...CAM_DISC }, // arrives as "Hubble just found a second one" plays
  { f: 560, ...CAM_DISC },
  { f: 615, ...CAM_WIDE }, // pulls back for the hexagon/decagon comparison
  { f: 750, ...CAM_WIDE },
  { f: 800, ...CAM_QUOTE },
  { f: 1070, ...CAM_QUOTE },
  { f: 1130, ...CAM_HOOK }, // returns to the hook framing — last frame ≈ frame 0
  { f: 1349, ...CAM_HOOK },
];

// =============================================================================
// QUOTE CARD — a bespoke element for this shot (per make-vox: project-specific
// hacks stay in the shot, the kit grows only for genuinely reusable pieces).
// =============================================================================
const QuoteCard: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = EASE_OUT(prog(frame, at, at + 16));
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: CAM_QUOTE.x,
        top: CAM_QUOTE.y,
        width: 780,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 30}px)`,
        opacity: p,
        background: VOX.cream,
        borderRadius: 10,
        padding: '54px 50px',
        boxShadow: '0 24px 60px rgba(40,28,12,0.35)',
      }}
    >
      <div style={{ fontFamily: FONT_EDITORIAL, fontWeight: 900, fontSize: 90, color: VOX.yellow, lineHeight: 0.4, marginBottom: 18 }}>
        &ldquo;
      </div>
      <div style={{ fontFamily: FONT_EDITORIAL, fontWeight: 700, fontStyle: 'italic', fontSize: 46, color: VOX.ink, lineHeight: 1.32 }}>
        This feature is different — the question is, why did it suddenly form now, when we
        haven&rsquo;t seen one before?
      </div>
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 3, background: VOX.red }} />
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 25, letterSpacing: 1.5, color: VOX.inkSoft, textTransform: 'uppercase' }}>
          Amy Simon · NASA Goddard
        </div>
      </div>
    </div>
  );
};

// Captions sit at the kit's default safe y (1280 — was hardcoded to 1620 here, which had
// only 300px of bottom clearance and sat inside real platform UI; dropping the override
// fixes it) for the whole video EXCEPT during the quote beat: the QuoteCard renders centered
// on-screen when the camera is at CAM_QUOTE (~screen y 730-1190 at that zoom), which would
// overlap a caption plate at 1280. The quote's words are already on screen in the card
// itself, so hiding the redundant caption track there (frame F(25.3)-F(36.1)) avoids the
// overlap instead of cramming both into the same band.
const QUOTE_CAPTIONS_HIDE_FROM = F(25.3);
const QUOTE_CAPTIONS_HIDE_TO = F(36.1);

const GatedCaptions: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= QUOTE_CAPTIONS_HIDE_FROM && frame < QUOTE_CAPTIONS_HIDE_TO) return null;
  return <Captions lines={VO} accent={VOX.yellow} plate />;
};

const Vox2Decagon: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0a0a0c' }}>
      <CollageBoard cam={CAM}>
        {/* h=2600, not the canvas's own 1920: the camera travels down to CAM_QUOTE (board y up
            to ~2364 at its zoom), well past what PaperBG's default 10% overscan on a
            1920-tall board would cover — QA caught the raw AbsoluteFill background showing
            through at the bottom of the quote beat. PaperBG's w/h just set the backdrop's own
            size, independent of the canvas, so enlarging h alone is the direct fix. */}
        <PaperBG w={1080} h={2600} />

        {/* HOOK — pre-rolled (negative `at`) so it's already settled at frame 0,
            per the hook rule: frame 0 fully composed, no fade-in caught mid-flight. */}
        <Cutout src={asset('hexagon-north.png')} x={CAM_HOOK.x} y={CAM_HOOK.y} w={560} at={-30} dur={20} enter="place" rotate={-2} depth={0.02} />
        <SerifStatement
          words={[{ t: 'ONE' }, { t: 'SHAPE.' }, { t: 'FOR' }, { t: '40' }, { t: 'YEARS.', hl: true }]}
          x={CAM_HOOK.x}
          y={190}
          w={620}
          at={-40}
          size={58}
          backing
          depth={0.03}
        />
        <LabelChip text="Saturn's north pole" x={CAM_HOOK.x} y={1080} at={-30} accent={VOX.teal} kicker="THE HEXAGON" depth={0.02} />

        {/* DISCOVERY — chips near the decagon; the camera panning there is what
            reveals them, not an opacity cue. */}
        <Cutout src={asset('decagon-south.png')} x={CAM_DISC.x} y={CAM_DISC.y} w={560} at={F(10.2)} dur={16} enter="place" rotate={2} depth={0.02} />
        <LabelChip text="South pole" x={CAM_DISC.x} y={420} at={F(10.6)} accent={VOX.red} kicker="NEW LOCATION" depth={0.03} />
        <LabelChip text="10 sides" x={950} y={CAM_DISC.y} at={F(14.6)} accent={VOX.red} kicker="THE SHAPE" depth={0.03} />
        <LabelChip text="First time ever recorded" x={CAM_DISC.x} y={1060} at={F(17.3)} accent={VOX.red} kicker="NEVER SEEN BEFORE" depth={0.03} />

        {/* CONTRAST beat: no separate headline here — the hook title (still visible near the
            hexagon at this camera position) sits close enough to a new statement's natural
            position that the two read as one run-on sentence (caught in QA at frame 615:
            "ONE SHAPE. FOR 40 YEARS, UNCHANGED. THIS ONE IS STILL STRENGTHENING."). The
            side-by-side photos plus the existing chips already carry the comparison; VO +
            captions carry the "unchanged vs strengthening" line without a redundant on-screen
            headline competing for the same space. */}

        {/* QUOTE */}
        <QuoteCard at={F(25.7)} />

        {/* PAYOFF — citation chip near the hook framing; camera returning there
            is the loop closing, same trick short-10 through short-14 all use. */}
        {/* y=1230, not 1120: that sat close enough to the hexagon's own label chip (y=1080)
            that the two overlapped — confirmed still overlapping even at the settled, fully
            post-transition last frame, not just mid-pan. */}
        <LabelChip text="Science Advances · Sept 2026" x={CAM_HOOK.x} y={1230} at={F(36.4)} accent={VOX.yellow} kickerColor={VOX.inkSoft} kicker="PUBLISHED" depth={0.02} />
      </CollageBoard>

      <GatedCaptions />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

export default Vox2Decagon;
