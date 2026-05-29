import { FaceDetection, FrameSample } from '../../types/faceguard';
import { normalizeEmbedding } from './vector';

export type ModelAdapter = {
  initialize(): Promise<void>;
  detectFace(frame: FrameSample): Promise<FaceDetection | undefined>;
  estimateTextureLiveness(frame: FrameSample): Promise<number>;
  createEmbedding(frame: FrameSample, face: FaceDetection): Promise<number[]>;
};

export class SimulatedTfliteAdapter implements ModelAdapter {
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async detectFace(frame: FrameSample): Promise<FaceDetection | undefined> {
    this.ensureReady();
    if (frame.luminance < 0.18) {
      return undefined;
    }

    return (
      frame.face ?? {
        box: { x: 0.26, y: 0.18, width: 0.48, height: 0.52 },
        confidence: 0.97,
        landmarks: {
          leftEye: { x: 0.39, y: 0.38 },
          rightEye: { x: 0.61, y: 0.38 },
          nose: { x: 0.5, y: 0.5 },
          mouthLeft: { x: 0.41, y: 0.65 },
          mouthRight: { x: 0.59, y: 0.65 },
          upperLip: { x: 0.5, y: 0.63 },
          lowerLip: { x: 0.5, y: 0.69 }
        }
      }
    );
  }

  async estimateTextureLiveness(frame: FrameSample): Promise<number> {
    this.ensureReady();
    const lightingPenalty = frame.luminance < 0.28 ? 0.1 : 0;
    return Math.max(0, Math.min(1, frame.textureScore - lightingPenalty));
  }

  async createEmbedding(frame: FrameSample, face: FaceDetection): Promise<number[]> {
    this.ensureReady();
    const seed = face.confidence + frame.luminance + frame.textureScore;
    const vector = Array.from({ length: 512 }, (_, index) => {
      const wave = Math.sin(index * 0.23) + Math.cos(index * 0.07);
      const stableNoise = Math.sin(seed * (index + 1)) * 0.005;
      return wave / 2 + stableNoise;
    });
    return normalizeEmbedding(vector);
  }

  private ensureReady(): void {
    if (!this.initialized) {
      throw new Error('FaceGuard model adapter was used before initialization.');
    }
  }
}
