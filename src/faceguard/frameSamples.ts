import { FrameSample } from '../types/faceguard';

export function createDemoFrameSequence(): FrameSample[] {
  const now = Date.now();
  return [
    sampleFrame('open-1', now, 0.64, 0.91, 0.5, 0, 0.31, 0.1, 0.06),
    sampleFrame('turn-left', now + 80, 0.65, 0.9, 0.455, -18, 0.32, 0.1, 0.055),
    sampleFrame('blink', now + 160, 0.65, 0.92, 0.5, 0, 0.18, 0.1, 0.015),
    sampleFrame('turn-right', now + 240, 0.66, 0.91, 0.548, 18, 0.32, 0.1, 0.06),
    sampleFrame('smile', now + 320, 0.66, 0.92, 0.5, 0, 0.31, 0.84, 0.05, true)
  ];
}

function sampleFrame(
  id: string,
  timestamp: number,
  luminance: number,
  textureScore: number,
  noseX: number,
  headYawDegrees: number,
  eyeAspectRatio: number,
  smileScore: number,
  mouthHeight: number,
  smiling = false
): FrameSample {
  return {
    id,
    timestamp,
    luminance,
    textureScore,
    eyeAspectRatio,
    headYawDegrees,
    smileScore,
    face: {
      box: { x: 0.26, y: 0.18, width: 0.48, height: 0.52 },
      confidence: 0.98,
      landmarks: {
        leftEye: { x: 0.39, y: 0.38 },
        rightEye: { x: 0.61, y: 0.38 },
        nose: { x: noseX, y: 0.5 },
        mouthLeft: { x: smiling ? 0.38 : 0.42, y: 0.65 },
        mouthRight: { x: smiling ? 0.62 : 0.58, y: 0.65 },
        upperLip: { x: 0.5, y: 0.65 - mouthHeight / 2 },
        lowerLip: { x: 0.5, y: 0.65 + mouthHeight / 2 }
      }
    }
  };
}
