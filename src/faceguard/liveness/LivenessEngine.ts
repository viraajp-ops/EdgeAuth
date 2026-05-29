import { FACEGUARD_CONFIG } from '../config';
import { evaluateChallenge } from './activeChallenges';
import { FrameSample, LivenessChallenge, LivenessResult } from '../../types/faceguard';

export class LivenessEngine {
  evaluate(frames: FrameSample[], challenges: LivenessChallenge[]): LivenessResult {
    const challengeResults = challenges.map(challenge => ({
      challenge,
      passed: evaluateChallenge(challenge, frames)
    }));

    const passedChallenges = challengeResults
      .filter(result => result.passed)
      .map(result => result.challenge);
    const failedChallenges = challengeResults
      .filter(result => !result.passed)
      .map(result => result.challenge);

    const textureScore =
      frames.reduce((sum, frame) => sum + frame.textureScore, 0) / Math.max(frames.length, 1);
    const activeScore = passedChallenges.length / Math.max(challenges.length, 1);
    const score = Number((textureScore * 0.45 + activeScore * 0.55).toFixed(4));
    const passed =
      score >= FACEGUARD_CONFIG.livenessThreshold &&
      passedChallenges.length >= FACEGUARD_CONFIG.requiredActiveChallengePasses;

    return {
      passed,
      score,
      passedChallenges,
      failedChallenges,
      reason: passed ? undefined : 'Liveness verification failed. Please blink, turn your head, and smile clearly.'
    };
  }
}
