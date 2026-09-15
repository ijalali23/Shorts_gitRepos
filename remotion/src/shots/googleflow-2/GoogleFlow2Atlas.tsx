import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { StatCard, Grain, VOX } from '../../lib/collage';
import { Captions, Kicker } from '../../lib/shorts';
import { VO } from './vo.gen';

// =============================================================================
// COMPOSITION CONFIG — GoogleFlow Gen EP02: "The Comet That's Not From Here"
// (3I/ATLAS). Visuals are Flow-generated B-roll (Veo 3.1 Fast, no on-screen
// text) laid into Sequences at the REAL VO word timestamps; every number,
// quote, and label on screen is real code-driven text added here, never
// baked into the generated video. See vox-shorts/googleflow-2-atlas/beats.json
// and vox-shorts/GOOGLEFLOW-NOTES.md for the full production history —
// clip 2 (context beat) failed compliance (a hand was visible the entire
// clip) and was dropped rather than regenerated; its coverage was absorbed
// by extending clip 1 and borrowing spare footage from clips 3b/5b, all
// real motion, no freeze-frames. Clips 3a/3b and 5a/5b were meant to be
// chained continuations of each other but Flow did not honor that — they
// are used as two independent cuts within their beats instead.
// =============================================================================
export const compositionConfig = {
  id: 'GoogleFlow2Atlas',
  durationInSeconds: 47.5,
  fps: 24,
  width: 1080,
  height: 1920,
};

const F = (s: number) => Math.round(s * 24);
const asset = (f: string) => staticFile(`projects/googleflow-2-atlas/${f}`);

// Real VO start frames (from beats.json's actual ElevenLabs alignment) — each
// video segment starts exactly where its narration starts, not just concatenated.
const HOOK_AT = F(0.4);
const CONTEXT_AT = F(7.15);
const ESCALATION_AT = F(15.02);
const REVELATION_AT = F(26.5);
const ENDING_AT = F(35.33);

const NUMBERS_AT = F(26.5); // revelation: methanol comparison card
const CLOSING_TAG_AT = F(35.33); // ending: "three, ever" tag

const GoogleFlow2Atlas: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#050608' }}>
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

      {/* Real numbers, sourced from the ALMA/NRAO press release — never AI-rendered text.
          StatCard has no built-in exit, so each one is boxed in its own Sequence — otherwise
          it stays on screen for the rest of the video and stacks with the next one (caught in
          QA: the methanol card was still showing during the ending beat). */}
      <Sequence from={NUMBERS_AT} durationInFrames={ENDING_AT - NUMBERS_AT}>
        <StatCard
          x={540}
          y={1720}
          at={F(3.2)}
          kicker="ALMA Observatory, 2026"
          big="70–120×"
          sub={'Methanol-to-HCN ratio in 3I/ATLAS - far above almost every comet native to our own solar system.'}
          w={860}
        />
      </Sequence>

      {/* Ending tag: the real count */}
      <Sequence from={CLOSING_TAG_AT}>
        <StatCard
          x={540}
          y={1720}
          at={F(6.5)}
          kicker="In all of recorded history"
          big="1I · 2I · 3I"
          sub="Three interstellar visitors, ever. This is the third."
          w={760}
        />
      </Sequence>

      <Kicker text="3I/ATLAS" at={-10} until={F(4)} />
      <Captions lines={VO} accent={VOX.yellow} plate />
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

export default GoogleFlow2Atlas;
