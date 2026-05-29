export type LivenessChallenge = 'blink' | 'headTurn' | 'smile';

export type AuthStatus =
  | 'idle'
  | 'initializing'
  | 'camera-ready'
  | 'detecting-face'
  | 'checking-liveness'
  | 'matching-face'
  | 'success'
  | 'failed';

export type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FaceLandmarks = {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  mouthLeft: Point;
  mouthRight: Point;
  upperLip: Point;
  lowerLip: Point;
};

export type Point = {
  x: number;
  y: number;
};

export type FaceDetection = {
  box: FaceBox;
  landmarks: FaceLandmarks;
  confidence: number;
};

export type FrameSample = {
  id: string;
  timestamp: number;
  luminance: number;
  textureScore: number;
  rgbData?: Uint8Array;
  eyeAspectRatio?: number;
  headYawDegrees?: number;
  smileScore?: number;
  face?: FaceDetection;
};

export type LivenessResult = {
  passed: boolean;
  score: number;
  passedChallenges: LivenessChallenge[];
  failedChallenges: LivenessChallenge[];
  reason?: string;
};

export type FaceMatchResult = {
  matched: boolean;
  userId?: string;
  score: number;
  threshold: number;
};

export type FaceAuthResult = {
  id: string;
  userId: string;
  matched: true;
  score: number;
  livenessScore: number;
  modelVersion: string;
  createdAt: string;
  deviceId: string;
  durationMs: number;
};

export type FaceAuthFailure = {
  code:
    | 'NO_FACE'
    | 'LOW_LIGHT'
    | 'LIVENESS_FAILED'
    | 'MATCH_FAILED'
    | 'TIMEOUT'
    | 'CAMERA_UNAVAILABLE'
    | 'MODEL_UNAVAILABLE';
  reason: string;
};

export type EnrolledIdentity = {
  userId: string;
  name: string;
  role: string;
  embedding: number[];
  updatedAt: string;
};

export type PendingAuthRecord = FaceAuthResult & {
  queueId: string;
  encryptedPayload: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
};
