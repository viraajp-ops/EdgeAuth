import { v4 as uuid } from 'uuid';
import { FACEGUARD_CONFIG } from './config';
import { LivenessEngine } from './liveness/LivenessEngine';
import { ModelAdapter, SimulatedTfliteAdapter } from './model/ModelAdapter';
import { cosineSimilarity } from './model/vector';
import { SAMPLE_IDENTITIES } from './sampleIdentities';
import {
  EnrolledIdentity,
  FaceAuthFailure,
  FaceAuthResult,
  FaceMatchResult,
  FrameSample,
  LivenessChallenge
} from '../types/faceguard';

export type AuthenticateOptions = {
  frames: FrameSample[];
  challenges?: LivenessChallenge[];
  threshold?: number;
  deviceId: string;
};

export class FaceGuardEngine {
  private readonly liveness = new LivenessEngine();
  private initialized = false;

  constructor(
    private readonly modelAdapter: ModelAdapter = new SimulatedTfliteAdapter(),
    private readonly identities: EnrolledIdentity[] = SAMPLE_IDENTITIES
  ) {}

  async initialize(): Promise<void> {
    await this.modelAdapter.initialize();
    this.initialized = true;
  }

  async authenticate(options: AuthenticateOptions): Promise<FaceAuthResult> {
    if (!this.initialized) {
      throw this.failure('MODEL_UNAVAILABLE', 'FaceGuard models are not initialized.');
    }

    const started = Date.now();
    const frames = await this.prepareFrames(options.frames);
    const faceFrame = frames.find(frame => frame.face);

    if (!faceFrame?.face) {
      throw this.failure('NO_FACE', 'No usable face was detected in the camera frame.');
    }

    if (faceFrame.luminance < 0.18) {
      throw this.failure('LOW_LIGHT', 'Lighting is too low for reliable authentication.');
    }

    const challenges = options.challenges ?? FACEGUARD_CONFIG.defaultChallenges;
    const livenessResult = this.liveness.evaluate(frames, challenges);
    if (!livenessResult.passed) {
      throw this.failure('LIVENESS_FAILED', livenessResult.reason ?? 'Liveness failed.');
    }

    const embedding = await this.modelAdapter.createEmbedding(faceFrame, faceFrame.face);
    const match = this.match(embedding, options.threshold ?? FACEGUARD_CONFIG.authThreshold);
    if (!match.matched || !match.userId) {
      throw this.failure('MATCH_FAILED', 'Face did not match an enrolled field personnel profile.');
    }

    const durationMs = Date.now() - started;
    if (durationMs > FACEGUARD_CONFIG.maxAuthDurationMs) {
      throw this.failure('TIMEOUT', 'Authentication exceeded the one-second target.');
    }

    return {
      id: uuid(),
      userId: match.userId,
      matched: true,
      score: match.score,
      livenessScore: livenessResult.score,
      modelVersion: FACEGUARD_CONFIG.modelVersion,
      createdAt: new Date().toISOString(),
      deviceId: options.deviceId,
      durationMs
    };
  }

  private async prepareFrames(frames: FrameSample[]): Promise<FrameSample[]> {
    return Promise.all(
      frames.map(async frame => ({
        ...frame,
        face: frame.face ?? (await this.modelAdapter.detectFace(frame)),
        textureScore: await this.modelAdapter.estimateTextureLiveness(frame)
      }))
    );
  }

  private match(embedding: number[], threshold: number): FaceMatchResult {
    const best = this.identities
      .map(identity => ({
        identity,
        score: cosineSimilarity(embedding, identity.embedding)
      }))
      .sort((a, b) => b.score - a.score)[0];

    return {
      matched: Boolean(best && best.score >= threshold),
      userId: best?.identity.userId,
      score: Number((best?.score ?? 0).toFixed(4)),
      threshold
    };
  }

  private failure(code: FaceAuthFailure['code'], reason: string): FaceAuthFailure {
    return { code, reason };
  }
}
