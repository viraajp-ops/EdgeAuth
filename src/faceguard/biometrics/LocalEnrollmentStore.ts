import * as SecureStore from 'expo-secure-store';

const ENROLLMENT_KEY = 'faceguard-local-enrollment-v2';

export type LocalEnrollment = {
  userId: string;
  name: string;
  embedding: number[];
  enrolledAt: string;
};

export async function getLocalEnrollment(): Promise<LocalEnrollment | undefined> {
  const value = await SecureStore.getItemAsync(ENROLLMENT_KEY);
  if (!value) {
    return undefined;
  }

  const parsed = JSON.parse(value) as LocalEnrollment & { descriptor?: { vector: number[] } };
  if (parsed.embedding?.length) {
    return parsed;
  }

  // Migrate legacy photo-descriptor enrollments by clearing stale data.
  if (parsed.descriptor) {
    await SecureStore.deleteItemAsync(ENROLLMENT_KEY);
  }

  return undefined;
}

export async function saveLocalEnrollment(enrollment: LocalEnrollment): Promise<void> {
  await SecureStore.setItemAsync(ENROLLMENT_KEY, JSON.stringify(enrollment), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
  });
}

export async function clearLocalEnrollment(): Promise<void> {
  await SecureStore.deleteItemAsync(ENROLLMENT_KEY);
}
