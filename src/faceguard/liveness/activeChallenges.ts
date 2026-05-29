import { FaceDetection, FrameSample, LivenessChallenge } from '../../types/faceguard';

const BLINK_EAR_THRESHOLD = 0.25;
const HEAD_TURN_DEGREES = 15;
const HEAD_TURN_NOSE_DELTA = 0.035;
const SMILE_RATIO_THRESHOLD = 2.8;

export function detectBlink(frames: FrameSample[]): boolean {
  return frames.some(frame => typeof frame.eyeAspectRatio === 'number' && frame.eyeAspectRatio < BLINK_EAR_THRESHOLD);
}

export function detectHeadTurn(frames: FrameSample[]): boolean {
  const yawValues = frames
    .map(frame => frame.headYawDegrees)
    .filter((value): value is number => typeof value === 'number');
  if (yawValues.some(value => Math.abs(value) >= HEAD_TURN_DEGREES)) {
    return true;
  }

  const nosePositions = frames
    .map(frame => frame.face?.landmarks.nose.x)
    .filter((value): value is number => typeof value === 'number');

  if (nosePositions.length < 2) {
    return false;
  }

  return Math.max(...nosePositions) - Math.min(...nosePositions) > HEAD_TURN_NOSE_DELTA;
}

export function detectSmile(face?: FaceDetection): boolean {
  if (!face) {
    return false;
  }
  const { mouthLeft, mouthRight, upperLip, lowerLip } = face.landmarks;
  const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
  const mouthHeight = Math.abs(lowerLip.y - upperLip.y);
  return mouthWidth / Math.max(mouthHeight, 0.001) > SMILE_RATIO_THRESHOLD;
}

export function evaluateChallenge(challenge: LivenessChallenge, frames: FrameSample[]): boolean {
  switch (challenge) {
    case 'blink':
      return detectBlink(frames);
    case 'headTurn':
      return detectHeadTurn(frames);
    case 'smile':
      return frames.some(frame => (frame.smileScore ?? 0) > 0.7) || detectSmile(frames[frames.length - 1]?.face);
    default:
      return false;
  }
}
