import { v4 as uuid } from 'uuid';
import { FaceAuthFailure, FaceAuthResult } from '../../types/faceguard';
import {
  comparePhotoDescriptors,
  createPhotoDescriptor,
  estimateSequenceLiveness
} from './PhotoDescriptor';
import { getLocalEnrollment, saveLocalEnrollment } from './LocalEnrollmentStore';
import { FACEGUARD_CONFIG } from '../config';

const LOCAL_MATCH_THRESHOLD = 0.91;
const LOCAL_LIVENESS_THRESHOLD = 0.18;

export async function hasLocalEnrollment(): Promise<boolean> {
  return Boolean(await getLocalEnrollment());
}

export async function enrollLocalFace(photoPath: string): Promise<void> {
  const descriptor = await createPhotoDescriptor(photoPath);
  if (descriptor.qualityScore < 0.08) {
    throw failure('NO_FACE', 'Captured image quality is too low. Try again with your face centered.');
  }

  await saveLocalEnrollment({
    userId: 'DL-FIELD-LOCAL',
    name: 'Local Field User',
    descriptor,
    enrolledAt: new Date().toISOString()
  });
}

export async function authenticateLocalFace(
  photoPaths: string[],
  deviceId: string
): Promise<FaceAuthResult> {
  const started = Date.now();
  const enrollment = await getLocalEnrollment();
  if (!enrollment) {
    throw failure('MATCH_FAILED', 'No offline enrollment found. Enroll your face first.');
  }

  const descriptors = await Promise.all(photoPaths.map(path => createPhotoDescriptor(path)));
  const finalDescriptor = descriptors[descriptors.length - 1];
  if (!finalDescriptor) {
    throw failure('NO_FACE', 'No capture was available for authentication.');
  }

  const livenessScore = estimateSequenceLiveness(descriptors);
  if (livenessScore < LOCAL_LIVENESS_THRESHOLD) {
    throw failure('LIVENESS_FAILED', 'Move naturally during the challenge. The app did not detect enough live variation.');
  }

  const score = comparePhotoDescriptors(enrollment.descriptor, finalDescriptor);
  if (score < LOCAL_MATCH_THRESHOLD) {
    throw failure('MATCH_FAILED', `Face did not match the offline enrollment. Score ${score}.`);
  }

  return {
    id: uuid(),
    userId: enrollment.userId,
    matched: true,
    score,
    livenessScore,
    modelVersion: `${FACEGUARD_CONFIG.modelVersion}-local-template`,
    createdAt: new Date().toISOString(),
    deviceId,
    durationMs: Date.now() - started
  };
}

function failure(code: FaceAuthFailure['code'], reason: string): FaceAuthFailure {
  return { code, reason };
}
