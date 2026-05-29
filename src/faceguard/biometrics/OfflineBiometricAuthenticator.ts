import { createFramesFromPhotoPaths } from '../photoFrames';
import { FaceGuardEngine } from '../FaceGuardEngine';
import { FaceAuthFailure, FaceAuthResult } from '../../types/faceguard';
import { getLocalEnrollment } from './LocalEnrollmentStore';

let sharedEngine: FaceGuardEngine | undefined;

async function getEngine(): Promise<FaceGuardEngine> {
  if (!sharedEngine) {
    sharedEngine = new FaceGuardEngine();
    await sharedEngine.initialize();
  }
  return sharedEngine;
}

export async function hasLocalEnrollment(): Promise<boolean> {
  return Boolean(await getLocalEnrollment());
}

export async function enrollLocalFace(photoPath: string): Promise<void> {
  const engine = await getEngine();
  const frames = await createFramesFromPhotoPaths([photoPath]);
  await engine.enrollFromFrames(frames);
}

export async function authenticateLocalFace(
  photoPaths: string[],
  deviceId: string
): Promise<FaceAuthResult> {
  const engine = await getEngine();
  const frames = await createFramesFromPhotoPaths(photoPaths);
  return engine.authenticate({
    frames,
    deviceId,
    useLocalEnrollment: true
  });
}

export function resetOfflineEngine(): void {
  sharedEngine = undefined;
}
