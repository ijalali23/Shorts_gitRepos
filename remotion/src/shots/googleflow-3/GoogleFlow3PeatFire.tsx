import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { StatCard, Grain, VOX } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG — GoogleFlow Gen EP03: "The Fire You Can't See"
// (Indonesia's underground peat fires). Cinematic/photoreal B-roll (Veo 3.1
// Fast, 9 independent text-to-video clips, no chaining), laid into Sequences
// at the REAL VO word timestamps; every number and quote on screen is real
// code-driven text added here, never baked into the generated video. See
// vox-shorts/googleflow-3-peatfire/beats.json and vox-shorts/GOOGLEFLOW-NOTES.md
// for production history — clip 4a (revelation take A) came back showing
// visible open flame instead of the intended ember-glow-only look; kept as-is
// per user decision rather than spending a redo, since it still reads fine
// against the "won't stop" line.
// =============================================================================
export const compositionConfig = {
  id: 'GoogleFlow3PeatFire',
  durationInSeconds: 54.0,
  fps: 24,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 24);
const asset = (f: string) => staticFile(`projects/googleflow-3-peatfire/${f}`);

// Real VO start frames (from beats.json's actual ElevenLabs alignment) — each
// video segment starts exactly where its narration starts.
const HOOK_AT = F(0.4);
const CONTEXT_AT = F(6.92);
const ESCALATION_AT = F(15.35);
const REVELATION_AT = F(25.38);
const ENDING_AT = F(41.65);
const TOTAL = F(54.0);

const GoogleFlow3PeatFire: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#050403' }}>
      <Sequence from={HOOK_AT}>
        <OffthreadVideo src={asset('b1.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>
      <Sequence from={CONTEXT_AT}>
        <OffthreadVideo src={asset('b2.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>
      <Sequence from={ESCALATION_AT}>
        <OffthreadVideo src={asset('b3.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>
      <Sequence from={REVELATION_AT}>
        <OffthreadVideo src={asset('b4.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>
      <Sequence from={ENDING_AT}>
        <OffthreadVideo src={asset('b5.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Sequence>

      {/* Real numbers, sourced from Phase 1's cited research — never AI-rendered text.
          StatCard has no built-in exit, so each is boxed in its own Sequence so it clips
          out of the timeline once its beat ends (EP02's stacking bug, avoided here). */}
      <Sequence from={ESCALATION_AT} durationInFrames={REVELATION_AT - ESCALATION_AT}>
        <StatCard
          x={540}
          y={1720}
          at={F(4.0)}
          kicker="One month into the 2026 season"
          big="~10%"
          sub="of the greenhouse gas the entire 2015 fire crisis produced in three months."
          w={860}
        />
      </Sequence>

      <Sequence from={REVELATION_AT} durationInFrames={ENDING_AT - REVELATION_AT}>
        <StatCard
          x={540}
          y={1720}
          at={F(9.5)}
          kicker="Robert Field, Columbia University"
          big={'"It just\nwon’t stop."'}
          sub="Once a peat fire gets underground, surface fires stop being the concern."
          w={860}
        />
      </Sequence>

      <Sequence from={ENDING_AT} durationInFrames={TOTAL - ENDING_AT}>
        <StatCard
          x={540}
          y={1720}
          at={F(4.0)}
          kicker="The 2015 fires"
          big="100,000+"
          sub="deaths and $16–28B in damage across Southeast Asia."
          w={860}
        />
      </Sequence>

      <Kicker text="INDONESIA · 2026" at={-10} until={F(4.5)} />
      <Captions lines={VO} accent={VOX.yellow} plate />
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

export default GoogleFlow3PeatFire;
