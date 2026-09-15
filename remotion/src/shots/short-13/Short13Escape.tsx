import React from 'react';
import { AbsoluteFill, Easing, Sequence, useCurrentFrame } from 'remotion';
import { BigTitle, Captions, Kicker, PauseCard, ProgressBar, Stamp, StatChip, prog } from '../../lib/shorts';
import {
  Atmosphere,
  Cannon,
  Globe,
  R_EARTH,
  Trajectory,
  integrate,
  makeView,
  period,
  vCirc,
  vEsc,
} from '../../lib/orbit';
import { FONT_BODY, FONT_DISPLAY } from '../../fonts';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG
// =============================================================================
export const compositionConfig = {
  id: 'Short13Escape',
  durationInSeconds: 42,
  fps: 30,
  width: 1080,
  height: 1920,
};

const GOLD = '#f5d76e'; // survives: orbit, and escape
const ORANGE = '#ff8f6b'; // bound but not free — the "almost" speed
const RED = '#ff6b6b'; // gravity, still holding on
const SPACE = '#070b12';
const EASE_INOUT = Easing.bezier(0.37, 0, 0.63, 1);
const F = (s: number) => Math.round(s * 30);

// =============================================================================
// THE PHYSICS — every displayed number is read from vCirc/vEsc at the SAME R0 the
// simulation launches from, never a separately-typed constant. R0 = 15 km up (a
// launch-gantry altitude, not the ISS's 400 km from short-12) — negligible next to
// R_EARTH's 6,371 km, so both speeds round to the real, well-known Earth values.
// =============================================================================
const R0 = R_EARTH + 15000;
const V_ORB = vCirc(R0); // 7,900.5 m/s -> 7.9 km/s, the "first cosmic velocity"
const V_ESC = vEsc(R0); // 11,173.0 m/s -> 11.2 km/s, Earth's escape velocity
const V_LOOP = 9500; // between the two: bound, but not circular — a big ellipse

// THE INTEGRATOR. Same cannon, same tower shape as short-12 — only the speeds differ, and
// this time one of them is fast enough that gravity never turns it around.
const TORBIT = integrate(R0, V_ORB, period(R0) * 1.004, 4); // closes into its own tail
const TLOOP = integrate(R0, V_LOOP, 9000, 5); // balloons to ~2.6x Earth's radius, curves back
const TESC = integrate(R0, V_ESC, 5000, 5); // never turns back — verified by simulating it

// A rifle bullet's typical high-velocity muzzle speed, for the payoff comparison.
const BULLET_MPS = 1100;
const BULLET_RATIO = V_ESC / BULLET_MPS; // ~10.2 -> "about ten times"

const V = makeView(540, 790, 330);
const LAUNCH: [number, number] = [V.cx, V.cy - R0 * V.m2px];

// =============================================================================
// CUES — RETIMED against the real ElevenLabs word times (vo.gen.ts). Most estimates landed
// within a frame or two of the real word; the one that didn't was structural, not cosmetic:
// "Fire it up, sideways, anywhere..." and "Direction stops mattering..." both ran longer than
// their estimated windows even at gen_voice.py's 1.3x max time-stretch, so at the original
// (estimated) start times the two lines' audio overlapped the next line by 0.3–0.6s — audibly
// talking over itself. Fixed at the source: beats.json's start times for those two lines (and
// the payoff line after them) were pushed later to their real non-overlapping positions, and
// TWIST_OUT/PAYOFF_IN below were retimed to match — never paper over an audio overlap by
// just trimming visuals to the old, wrong schedule.
const HOOK_OUT = F(6.6);
const REWIND_IN = F(6.6); // "But forever" @ 6.61 — the escape arc un-draws back to the cannon
const REWIND_OUT = F(9.1);
const FIRE_LOOP = F(12.0); // "Crank the cannon up" @ 12.01
const LOOP_SETTLE = F(18.3); // "...still comes back." @ 18.48 — the big ellipse has played out
const PAUSE_FROM = F(18.6);
const PAUSE_DUR = F(4.0);
const ESC_IN = F(22.6); // "Eleven point two..." @ 22.6 — the escape shot re-fires
const ESC_CLOSE = F(27.0); // by "...at all." the ball has visibly left the frame for good
const STAMP_OUT = F(28.3);
const TWIST_IN = F(28.45); // "Fire it up, sideways, anywhere" @ 28.45
const TWIST_OUT = F(35.45); // "...Distance stops mattering." ends @ 35.45 (was 34.0 — too early
// for the retimed line; the fix above is what moved this, not a hand-picked polish tweak)
const PAYOFF_IN = F(35.53); // "That's escape velocity" @ 35.53 (was 34.3, same cause)
const LOOP = F(40.0);
const END = F(42.0);

// =============================================================================
// THE READOUT — three rungs, three fates. Unlike short-12's ladder (orbit vs. impact, a
// binary), this one is a progression: falls short of free / bound but not circular /
// actually gone. Built locally so each rung keeps its own semantics of colour.
// =============================================================================
const Rung: React.FC<{ label: string; note: string; color: string; on: number }> = ({ label, note, color, on }) => {
  if (on <= 0.01) return null;
  const live = on > 0.5;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: live ? 'rgba(13,17,23,0.92)' : 'rgba(13,17,23,0.45)',
        border: `2px solid ${live ? color : '#ffffff22'}`,
        borderRadius: 12,
        padding: '8px 16px',
        opacity: 0.35 + 0.65 * on,
        transform: `scale(${0.94 + 0.06 * on})`,
        transformOrigin: 'left center',
      }}
    >
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 36, color: live ? '#fff' : '#ffffff66' }}>
        {label}
      </span>
      <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: live ? color : '#ffffff44' }}>
        {note}
      </span>
    </div>
  );
};

const Short13Escape: React.FC = () => {
  const f = useCurrentFrame();

  const punch = f < LOOP ? 1.05 - 0.05 * EASE_INOUT(prog(f, 0, 30)) : 1.0 + 0.05 * EASE_INOUT(prog(f, LOOP, END));

  // THE REWIND (short-10/11/12's trick, fourth outing): frame 0 IS the escape already flown.
  // The setup un-draws it back to the cannon; the reveal fires it back out; the loop closes.
  const rewound = EASE_INOUT(prog(f, REWIND_IN, REWIND_OUT));
  const escT = Math.max(1 - rewound, prog(f, ESC_IN, ESC_CLOSE));

  const loopClear = 1 - prog(f, ESC_IN, ESC_IN + 14); // the "almost" shot clears for the reveal
  const loopT = prog(f, FIRE_LOOP, LOOP_SETTLE) * loopClear;
  const loopArcOp = prog(f, FIRE_LOOP, FIRE_LOOP + 5) * loopClear;

  const orbitRingOp = prog(f, F(0.2), F(1.2));
  const cannonOp = prog(f, F(0.2), F(1.0)) * (1 - prog(f, ESC_CLOSE, ESC_CLOSE + 20));

  const titleOp = Math.min(1, 1 - prog(f, HOOK_OUT, HOOK_OUT + 30) + prog(f, F(41.0), END));
  const stampOp = prog(f, ESC_CLOSE, ESC_CLOSE + 10) * (1 - prog(f, STAMP_OUT, STAMP_OUT + 8));
  const twistOp = prog(f, TWIST_IN, TWIST_IN + 14) * (1 - prog(f, TWIST_OUT, TWIST_OUT + 10));
  const payoffOp = prog(f, PAYOFF_IN, PAYOFF_IN + 14) * (1 - prog(f, LOOP, LOOP + 22));

  // the ladder clears before the title returns for the loop — otherwise the two overlap in
  // the closing frames (caught by QA: frame ~1259 had "STILL BOUND" sitting under the subtitle).
  const ladderOut = 1 - prog(f, F(38.0), F(39.8));
  // first rung waits for the hook title to finish fading (HOOK_OUT+30, short-12's convention) —
  // firing it at F(0.2) instead sat "7.9 km/s ORBITS" directly on top of the still-opaque title
  // and subtitle for the entire 6.6s hook (caught by QA at frames 40/120/160/198).
  const rungOrbit = prog(f, HOOK_OUT + 30, HOOK_OUT + 40) * ladderOut;
  const rungLoop = prog(f, FIRE_LOOP, FIRE_LOOP + 10) * ladderOut;
  const rungEsc = prog(f, ESC_IN, ESC_IN + 10) * ladderOut;

  return (
    <AbsoluteFill style={{ background: SPACE }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 44%, #13233a 0%, transparent 72%)' }} />

      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Globe view={V} lon0={12} lat0={18} />
          <Atmosphere view={V} km={100} />

          {/* decorative reference ring: the known baseline, a real circular orbit at THIS
              altitude — pushed a few px proud of the globe's own outline purely for
              legibility (the number 7.9 km/s is exact; this gap is not a claimed altitude). */}
          <circle cx={V.cx} cy={V.cy} r={V.rPx + 18} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="4 10" opacity={0.6 * orbitRingOp} />

          {/* the "almost" shot: bound, balloons out, curves back — computed by the same
              integrator as the escape arc below, only v0 differs. */}
          <Trajectory view={V} traj={TLOOP} t={loopT} color={ORANGE} opacity={loopArcOp} width={5} ballR={10} ball={loopT < 0.999} />

          {/* the hero: the ONE shot that doesn't come back. */}
          <Trajectory view={V} traj={TESC} t={escT} color={GOLD} width={5} ballR={11} ball={escT > 0.005 && escT < 0.995} glow />

          <Cannon view={V} altM={15000} color={GOLD} opacity={cannonOp} scale={1.15} />
        </svg>

        <div style={{ opacity: titleOp }}>
          <BigTitle
            lines={[
              { text: "ORBIT ISN'T ESCAPE.", color: '#ffffff' },
              { text: 'THIS SPEED IS.', color: GOLD },
            ]}
            subtitle={`${(V_ESC / 1000).toFixed(1)} km/s — nothing on Earth can call it back`}
            y={140}
            size={82}
            warm
          />
        </div>

        {/* waits for the hook title's fade to complete (HOOK_OUT+30), matching short-12's
            convention — starting at F(0.2) sat this pill directly on top of "THIS SPEED IS." */}
        <Kicker text="NEWTON'S CANNON, AGAIN" color={GOLD} y={205} at={HOOK_OUT + 30} until={F(11.8)} />
        <Kicker text="CRANK PAST ORBIT" color={ORANGE} y={205} at={F(12.0)} until={F(18.3)} />
        <Kicker text="ESCAPE VELOCITY" color={GOLD} y={205} at={ESC_IN} until={TWIST_OUT} />

        <div style={{ position: 'absolute', left: 40, top: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Rung label="7.9 km/s" note="ORBITS" color={GOLD} on={rungOrbit} />
          <Rung label="9.5 km/s" note="STILL BOUND" color={ORANGE} on={rungLoop} />
          <Rung label={`${(V_ESC / 1000).toFixed(1)} km/s`} note="ESCAPES" color={GOLD} on={rungEsc} />
        </div>

        <div style={{ opacity: stampOp }}>
          <Stamp text="GONE FOR GOOD" at={ESC_CLOSE} color={GOLD} x={540} y={1250} size={62} rotate={-5} />
        </div>

        {/* the twist: escape speed doesn't care which way you point the cannon, only how
            fast — true because vEsc(r) is a function of distance alone. */}
        <div style={{ opacity: twistOp }}>
          <StatChip label="Fire it any direction" value="Same speed. Same result." color={RED} x={240} y={1220} w={600} at={TWIST_IN} />
        </div>

        <div style={{ opacity: payoffOp }}>
          <StatChip
            label="That's escape velocity"
            value={`~${BULLET_RATIO.toFixed(0)}x a rifle bullet's speed`}
            color={GOLD}
            x={240}
            y={1250}
            w={600}
            at={PAYOFF_IN}
          />
        </div>
      </AbsoluteFill>

      <Sequence from={PAUSE_FROM} durationInFrames={PAUSE_DUR}>
        <PauseCard title="PAUSE" subtitle="is there a speed gravity can't reach?" durSec={4.0} accent={GOLD} y={700} />
      </Sequence>

      <Captions lines={VO} y={1420} accent={GOLD} plate />
      <ProgressBar color={GOLD} />
    </AbsoluteFill>
  );
};

export default Short13Escape;
