import * as FileSystem from 'expo-file-system';
import { PhotoDescriptor } from './PhotoDescriptor';
import { decryptJson, encryptJson } from '../security/crypto';

const ENROLLMENT_FILE = FileSystem.documentDirectory + 'faceguard-local-enrollment-v1.enc';

export type LocalEnrollment = {
  userId: string;
  name: string;
  embedding?: number[];
  descriptor?: PhotoDescriptor;
  enrolledAt: string;
};

export async function getLocalEnrollment(): Promise<LocalEnrollment | undefined> {
  try {
    const info = await FileSystem.getInfoAsync(ENROLLMENT_FILE);
    if (!info.exists) {
      return undefined;
    }
    const encrypted = await FileSystem.readAsStringAsync(ENROLLMENT_FILE);
    return await decryptJson<LocalEnrollment>(encrypted);
  } catch (error) {
    console.error('Failed to read local enrollment:', error);
    return undefined;
  }
}

export async function saveLocalEnrollment(enrollment: LocalEnrollment): Promise<void> {
  const encrypted = await encryptJson(enrollment);
  await FileSystem.writeAsStringAsync(ENROLLMENT_FILE, encrypted);
}

export async function clearLocalEnrollment(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(ENROLLMENT_FILE);
    if (info.exists) {
      await FileSystem.deleteAsync(ENROLLMENT_FILE);
    }
  } catch (error) {
    console.error('Failed to clear local enrollment:', error);
  }
}
