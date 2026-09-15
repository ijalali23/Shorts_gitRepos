import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { CollageBoard, Layer, ArchivalPhoto, SketchArrow, Grain, VOX } from '../../lib/collage';
import { DarkPaperBG, TornDivider, TapeStrip, Crosshair, ChevronStack, DossierLabel, DOSSIER } from '../../lib/collage-dossier';

// =============================================================================
// COMPOSITION CONFIG — prototype only, not a real episode. Purpose: check the
// "dossier" visual skin (torn black/cream split, grid, marker arrows, chevrons,
// crosshairs, dark label chip) reads well at phone scale before building a full
// component set or committing an episode to it. See conversation for context.
// =============================================================================
export const compositionConfig = {
  id: 'ProtoDossier',
  durationInSeconds: 3,
  fps: 30,
  width: 1080,
  height: 1920,
};

const W = 1080;
const H = 1920;
const SEAM_X = W * 0.42; // vertical torn seam: black panel left, cream panel right

export default function ProtoDossier() {
  return (
    <AbsoluteFill style={{ background: DOSSIER.black }}>
      <CollageBoard cam={[{ f: 0, x: W / 2, y: H / 2, z: 1 }]}>
        {/* left panel: dark/data side */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: SEAM_X, height: H, overflow: 'hidden' }}>
          <DarkPaperBG w={SEAM_X} h={H} />
        </div>

        {/* right panel: cream/photo side */}
        <div style={{ position: 'absolute', left: SEAM_X, top: 0, width: W - SEAM_X, height: H, overflow: 'hidden', background: VOX.paper }} />

        <TornDivider orientation="vertical" pos={SEAM_X} spanStart={-20} spanEnd={H + 20} amplitude={16} seed={3} z={5} />

        {/* decoration on the dark side */}
        <Crosshair x={90} y={140} z={6} />
        <Crosshair x={SEAM_X - 60} y={140} variant="target" z={6} />
        <Crosshair x={90} y={H - 140} variant="target" z={6} />
        <ChevronStack x={SEAM_X * 0.55} y={H * 0.62} count={4} z={6} />

        <DossierLabel kicker="1957:" text="FIRST ORBIT" x={SEAM_X * 0.5} y={H * 0.32} at={0} size={46} align="left" z={7} />

        {/* archival photo pinned on the cream side */}
        <ArchivalPhoto
          src={staticFile('projects/vox-1-coffee/layers/coffeehouse.png')}
          x={SEAM_X + (W - SEAM_X) / 2}
          y={H * 0.5}
          w={(W - SEAM_X) * 0.82}
          treatment="sepia"
          caption="Vostok 1, 1961"
          rotate={2}
          at={0}
          dur={1}
          enter="none"
          z={8}
        />

        {/* hand-drawn marker arrow crossing the seam, pointing at the photo */}
        <SketchArrow
          id="proto-arrow-1"
          d={`M ${SEAM_X * 0.7} ${H * 0.75} Q ${SEAM_X * 0.95} ${H * 0.68} ${SEAM_X + 40} ${H * 0.6}`}
          vb={{ w: W, h: H }}
          color={DOSSIER.yellow}
          width={12}
          at={0}
          dur={1}
          z={9}
        />

        <TapeStrip x={SEAM_X + (W - SEAM_X) * 0.22} y={H * 0.5 - ((W - SEAM_X) * 0.82) * 0.42} rotate={-10} z={10} />
        <TapeStrip x={SEAM_X + (W - SEAM_X) * 0.78} y={H * 0.5 - ((W - SEAM_X) * 0.82) * 0.42} rotate={9} z={10} />
      </CollageBoard>
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
}
