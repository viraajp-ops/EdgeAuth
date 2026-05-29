export { FaceGuardEngine } from './FaceGuardEngine';
export { FaceGuardProvider, useFaceGuardContext } from './FaceGuardProvider';
export { OfflineQueue } from './storage/OfflineQueue';
export { SyncService, AwsSyncClient, DemoSyncClient } from './sync/SyncService';
export { SimulatedTfliteAdapter } from './model/ModelAdapter';
export { FACEGUARD_CONFIG } from './config';
export type { ModelAdapter } from './model/ModelAdapter';
export type {
  FaceAuthFailure,
  FaceAuthResult,
  FrameSample,
  LivenessChallenge,
  PendingAuthRecord
} from '../types/faceguard';
