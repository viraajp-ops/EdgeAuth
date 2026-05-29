import { useCallback, useEffect, useState } from 'react';
import {
  authenticateLocalFace,
  enrollLocalFace,
  hasLocalEnrollment
} from '../faceguard/biometrics/OfflineBiometricAuthenticator';
import { useFaceGuardContext } from '../faceguard/FaceGuardProvider';
import { AuthStatus, FaceAuthFailure, FaceAuthResult } from '../types/faceguard';

export function useFaceAuth() {
  const { queue, ready, initError } = useFaceGuardContext();
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [lastResult, setLastResult] = useState<FaceAuthResult | undefined>();
  const [lastError, setLastError] = useState<FaceAuthFailure | undefined>();
  const [enrolled, setEnrolled] = useState(false);

  const refreshEnrollment = useCallback(async () => {
    setEnrolled(await hasLocalEnrollment());
  }, []);

  useEffect(() => {
    if (ready) {
      refreshEnrollment();
    }
  }, [ready, refreshEnrollment]);

  const enroll = useCallback(
    async (photoPath: string) => {
      if (!ready) {
        setStatus('initializing');
        if (initError) {
          setLastError({ code: 'MODEL_UNAVAILABLE', reason: initError });
        }
        return false;
      }

      setStatus('matching-face');
      setLastError(undefined);

      try {
        await enrollLocalFace(photoPath);
        await refreshEnrollment();
        setStatus('success');
        return true;
      } catch (error) {
        setLastError(error as FaceAuthFailure);
        setStatus('failed');
        return false;
      }
    },
    [initError, ready, refreshEnrollment]
  );

  const authenticate = useCallback(
    async (photoPaths: string[]) => {
      if (!ready) {
        setStatus('initializing');
        if (initError) {
          setLastError({ code: 'MODEL_UNAVAILABLE', reason: initError });
        }
        return;
      }

      setStatus('checking-liveness');
      setLastError(undefined);

      try {
        const result = await authenticateLocalFace(photoPaths, 'offline-camera-device');
        await queue.enqueue(result);
        setLastResult(result);
        setStatus('success');
        return result;
      } catch (error) {
        const failure = error as FaceAuthFailure;
        setLastError(failure);
        setStatus('failed');
        return undefined;
      }
    },
    [initError, queue, ready]
  );

  return {
    status,
    ready,
    initError,
    enrolled,
    lastResult,
    lastError,
    enroll,
    authenticate
  };
}
