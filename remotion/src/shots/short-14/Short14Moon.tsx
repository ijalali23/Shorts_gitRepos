import React from 'react';
import { AbsoluteFill, Easing, Sequence, useCurrentFrame } from 'remotion';
import { BigTitle, Captions, Kicker, PauseCard, ProgressBar, StatChip, prog } from '../../lib/shorts';
import { Atmosphere, Globe, R_EARTH, ISS_ALT, SpeedLadder, gAt, makeView, satPos, vCirc, vEsc } from '../../lib/orbit';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Short14Moon',
  durationInSeconds: 66,
  fps: 30,
  width: 1080,
  height: 1920,
};

const GOLD = '#f5d76e';
const RED = '#ff6b6b';
const SPACE = '#070b12';
const EASE_INOUT = Easing.bezier(0.37, 0, 0.63, 1);
const F = (s: number) => Math.round(s * 30);

// =============================================================================
// THE PHYSICS — every displayed number is read from gAt/vCirc/vEsc at R_MOON, the same
// functions and the same GM/R_EARTH constants short-12/13 use. The ISS numbers (gAt(R_ISS),
// its 4.35 m/s fall) are short-12's own, cited unchanged for continuity across the series.
// =============================================================================
const R_ISS = R_EARTH + ISS_ALT;
const R_MOON = 384400e3; // mean Earth-Moon distance, centre to centre — a standard figure
const G_SURF = gAt(R_EARTH); // 9.8203 m/s²
const G_ISS = gAt(R_ISS); // 8.6943 m/s² — 88.5% of surface (short-12)
const G_MOON = gAt(R_MOON); // 0.0026976 m/s² — 0.027% of surface
const FALL_ISS = 0.5 * G_ISS * 1; // 4.3471 m in the first second (short-12's own number)
const FALL_MOON_MM = 0.5 * G_MOON * 1 * 1000; // 1.3488 mm in the first second
const V_MOON = vCirc(R_MOON); // 1018.3 m/s — real Moon ≈ 1.02 km/s
const V_ESC_MOON = vEsc(R_MOON); // 1440.1 m/s — the bound orbit is not a coincidence

// =============================================================================
// TWO VIEWS, crossfaded, instead of one true-scale diagram trying to do both jobs (v1's bug:
// a single 14px-Earth view made the Moon's true 60.3x-radius ring ~1690px wide — far wider than
// the 1080px frame, so it clipped off both edges in every shot).
//
// VIEW A ("near") — the hook/closing hero shot: a large, detailed, glowing globe, same
// component and style short-12/13 use. No true-scale requirement here; it just needs to look
// good and hold the title.
//
// VIEW B ("far") — the distance/scale diagram, sized so the WHOLE Moon ring fits inside the
// 1080px frame with real margin (checked: 460px ring radius, comfortably clear of both edges).
// =============================================================================
const NEAR = makeView(540, 800, 300);
const FAR = makeView(540, 960, 460 / (R_MOON / R_EARTH)); // rPx chosen so MOON_RING fits at 460px
const MOON_RING_PX = FAR.rPx * (R_MOON / R_EARTH); // = 460 by construction
const ISS_RING_PX = FAR.rPx * (1 + ISS_ALT / R_EARTH);

// =============================================================================
// CUES — v2, rebuilt end to end after user feedback on v1 (weak hook, clipped ring, flat
// script/delivery). Windows budgeted at ~2.3 words/sec (down from v1's 2.8-3.3), because v1
// needed a mid-stream retime for underestimating line length not once but twice across this
// pipeline (short-13 and short-14-v1 both shipped overlapping audio from tight windows) — this
// time the estimate starts conservative instead of being fixed after the fact again.
// =============================================================================
const HOOK_OUT = F(11.18); // both hook lines have landed
const TITLE_CLEAR = HOOK_OUT + 30;
const DIST_IN = F(16.23); // "three hundred eighty four thousand kilometers out" @ 16.23
const KICKER1_UNTIL = F(21.45);
const PAUSE_FROM = F(21.6);
const PAUSE_DUR = F(4.0);
const CROSSFADE_FAR_START = F(23.5); // near -> far, finishing just before reveal VO starts
const CROSSFADE_FAR_END = F(25.1);
const REVEAL_IN = F(25.19); // "It does. It just fades..." @ 25.19
const RUNG_SURF = F(29.89); // "Surface gravity: nine point eight..." @ 29.89
const RUNG_ISS = F(34.59); // "The station's still at eighty eight percent..." @ 34.59
const RUNG_MOON = F(38.85); // "But out at the Moon?..." @ 38.85
const FALL_STATS_IN = F(43.98); // "The station falls four meters..." @ 43.98
const TWIST_IN = F(49.99); // "Double the distance..." @ 49.99
const LADDER_OUT_FROM = F(53.5);
const LADDER_OUT_TO = F(54.4);
const CROSSFADE_NEAR_START = F(54.5); // far -> near, finishing right at the payoff line
const CROSSFADE_NEAR_END = F(56.4);
const PAYOFF_IN = F(56.42); // "So the Moon isn't tied down..." @ 56.42
const LOOP = F(63.5);
const END = F(66.0);

const Short14Moon: React.FC = () => {
  const f = useCurrentFrame();

  const punch = f < LOOP ? 1.05 - 0.05 * EASE_INOUT(prog(f, 0, 30)) : 1.0 + 0.05 * EASE_INOUT(prog(f, LOOP, END));

  // the crossfade: near (hook/closing hero shot) <-> far (the scale diagram). A single formula
  // covers all three phases (near-only / far-only / near-again) — see the comment in the CUES
  // block above for why these two transition windows sit where they do.
  const nearOp = Math.max(1 - prog(f, CROSSFADE_FAR_START, CROSSFADE_FAR_END), prog(f, CROSSFADE_NEAR_START, CROSSFADE_NEAR_END));
  const farOp = 1 - nearOp;

  // the Moon completes exactly one lap of its (schematic-speed) orbit across the whole
  // composition, so the last frame's angle matches frame 0's — same trick short-12 used for
  // the ISS's continuous rotation.
  const moonDeg = 205 + 360 * (f / END);
  const [mx, my] = satPos(FAR, R_MOON - R_EARTH, moonDeg);

  const titleOp = Math.min(1, 1 - prog(f, HOOK_OUT, HOOK_OUT + 30) + prog(f, LOOP, END));
  const distOp = prog(f, DIST_IN, DIST_IN + 12) * (1 - prog(f, KICKER1_UNTIL - 10, KICKER1_UNTIL));
  const fallStatsOp = prog(f, FALL_STATS_IN, FALL_STATS_IN + 10) * (1 - prog(f, TWIST_IN, TWIST_IN + 10));
  const twistOp = prog(f, TWIST_IN, TWIST_IN + 14) * (1 - prog(f, PAYOFF_IN, PAYOFF_IN + 10));
  const payoffOp = prog(f, PAYOFF_IN, PAYOFF_IN + 14) * (1 - prog(f, LOOP, LOOP + 22));
  const ladderOut = 1 - prog(f, LADDER_OUT_FROM, LADDER_OUT_TO);

  const rungs = [
    { v: `${G_SURF.toFixed(2)} m/s²`, note: 'SURFACE', on: prog(f, RUNG_SURF, RUNG_SURF + 10) * ladderOut },
    { v: `${G_ISS.toFixed(2)} m/s²`, note: `SPACE STATION · ${((G_ISS / G_SURF) * 100).toFixed(1)}%`, on: prog(f, RUNG_ISS, RUNG_ISS + 10) * ladderOut },
    { v: `${G_MOON.toFixed(4)} m/s²`, note: `THE MOON · ${((G_MOON / G_SURF) * 100).toFixed(2)}%`, on: prog(f, RUNG_MOON, RUNG_MOON + 10) * ladderOut },
  ];

  return (
    <AbsoluteFill style={{ background: SPACE }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 40%, #13233a 0%, transparent 72%)' }} />

      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        {/* VIEW A — near: the hook/closing hero shot. A big, detailed, glowing globe. */}
        <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, opacity: nearOp }}>
          <Globe view={NEAR} lon0={12} lat0={18} />
          <Atmosphere view={NEAR} km={100} />
        </svg>

        {/* VIEW B — far: the distance/scale diagram. Ring radius (460px) is comfortably inside
            the 1080px frame on both sides — checked against the frame width this time, not
            assumed. */}
        <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, opacity: farOp }}>
          <defs>
            <radialGradient id="earth-sm" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#5fae86" />
              <stop offset="45%" stopColor="#2f6a52" />
              <stop offset="100%" stopColor="#123a2c" />
            </radialGradient>
          </defs>
          <circle cx={FAR.cx} cy={FAR.cy} r={MOON_RING_PX} fill="none" stroke={GOLD} strokeWidth={2.5} strokeDasharray="5 12" opacity={0.55} />
          <circle cx={FAR.cx} cy={FAR.cy} r={ISS_RING_PX} fill="none" stroke="#7fc4e8" strokeWidth={2} opacity={0.5} />
          <circle cx={FAR.cx} cy={FAR.cy} r={FAR.rPx} fill="url(#earth-sm)" stroke="#7fc4e8" strokeWidth={1.5} opacity={0.9} />
          <circle cx={mx} cy={my} r={11} fill="#d8d8dc" stroke="#fff" strokeWidth={2} style={{ filter: `drop-shadow(0 0 8px ${GOLD}aa)` }} />
        </svg>

        <div style={{ opacity: titleOp }}>
          <BigTitle
            lines={[
              { text: 'THE MOON IS FALLING.', color: '#ffffff' },
              { text: 'IT NEVER LANDS.', color: GOLD },
            ]}
            subtitle="Gravity has been pulling it down for 4.5 billion years"
            y={140}
            size={78}
            warm
          />
        </div>

        <Kicker text="SAME TRICK, FARTHER OUT" color={GOLD} y={205} at={TITLE_CLEAR} until={KICKER1_UNTIL} />
        <Kicker text="GRAVITY'S REACH" color={GOLD} y={205} at={REVEAL_IN} until={TWIST_IN} />
        <Kicker text="INVERSE SQUARE LAW" color={RED} y={205} at={TWIST_IN} until={PAYOFF_IN} />

        <div style={{ opacity: farOp }}>
          <SpeedLadder rungs={rungs} x={40} y={300} color={GOLD} hit={GOLD} opacity={1} />
        </div>

        <div style={{ opacity: distOp }}>
          <StatChip label="Earth–Moon distance" value="384,400 km · 60 Earths away" color={GOLD} x={190} y={1220} w={700} at={DIST_IN} />
        </div>

        <div style={{ opacity: fallStatsOp }}>
          <StatChip label="Station falls" value={`${FALL_ISS.toFixed(2)} m / sec`} color={GOLD} x={100} y={1220} w={430} at={FALL_STATS_IN} />
          <StatChip label="Moon falls" value={`≈ ${FALL_MOON_MM.toFixed(2)} mm / sec`} color={GOLD} x={550} y={1220} w={430} at={FALL_STATS_IN + 8} />
        </div>

        <div style={{ opacity: twistOp }}>
          <StatChip label="Double the distance" value="Gravity: a quarter as strong. Every time." color={RED} x={240} y={1220} w={600} at={TWIST_IN} />
        </div>

        <div style={{ opacity: payoffOp }}>
          <StatChip label="The Moon isn't on a string" value={`${(V_MOON / 1000).toFixed(2)} km/s — well under the ${(V_ESC_MOON / 1000).toFixed(2)} km/s it'd take to leave`} color={GOLD} x={190} y={1220} w={700} at={PAYOFF_IN} />
        </div>
      </AbsoluteFill>

      <Sequence from={PAUSE_FROM} durationInFrames={PAUSE_DUR}>
        <PauseCard title="PAUSE" subtitle="does gravity even reach that far?" durSec={4.0} accent={GOLD} y={750} />
      </Sequence>

      <Captions lines={VO} y={1420} accent={GOLD} plate />
      <ProgressBar color={GOLD} />
    </AbsoluteFill>
  );
};

export default Short14Moon;
