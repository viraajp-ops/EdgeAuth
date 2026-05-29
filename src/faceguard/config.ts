import { LivenessChallenge } from '../types/faceguard';

export const FACEGUARD_CONFIG = {
  modelVersion: 'faceguard-mobile-v1.0.0',
  authThreshold: 0.82,
  livenessThreshold: 0.74,
  maxAuthDurationMs: 1000,
  activeChallengeTimeoutMs: 10000,
  requiredActiveChallengePasses: 2,
  defaultChallenges: ['blink', 'headTurn', 'smile'] satisfies LivenessChallenge[],
  modelManifest: {
    blazeFace: {
      file: 'models/blazeface-int8.tflite',
      expectedSizeMb: 1.5,
      license: 'Apache-2.0'
    },
    mobileFaceNet: {
      file: 'models/mobilefacenet-fp16.tflite',
      expectedSizeMb: 5,
      license: 'MIT'
    },
    antiSpoof: {
      file: 'models/antispoof-texture-int8.tflite',
      expectedSizeMb: 3,
      license: 'MIT'
    }
  }
} as const;
