import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceAuth } from '../hooks/useFaceAuth';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const { authenticate, enroll, enrolled, ready, initError, status, lastError, lastResult } = useFaceAuth();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [challengeText, setChallengeText] = useState('Enroll your face to start offline authentication');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => navigation.replace('Dashboard'), 450);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [lastResult, navigation]);

  const busy = status === 'detecting-face' || status === 'checking-liveness' || status === 'matching-face';
  const cameraReady = Boolean(device && hasPermission);
  const canCapture = cameraReady && ready && !busy;

  const capturePhoto = async (): Promise<string> => {
    if (!cameraRef.current) {
      throw new Error('Camera is not ready. Wait a moment and try again.');
    }
    const photo = await cameraRef.current.takePhoto({
      flash: 'off',
      enableShutterSound: false
    });
    if (!photo?.path) {
      throw new Error('Camera did not return a photo. Try again.');
    }
    return photo.path;
  };

  const enrollCurrentFace = async () => {
    setActionError(null);
    try {
      setChallengeText('Look straight at the camera');
      const photoPath = await capturePhoto();
      const ok = await enroll(photoPath);
      setChallengeText(ok ? 'Enrollment saved on this device' : 'Enrollment failed. Try again.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Enrollment failed unexpectedly.';
      setActionError(message);
      setChallengeText('Enrollment failed. Try again.');
    }
  };

  const verifyCurrentFace = async () => {
    setActionError(null);
    const prompts = ['Blink once', 'Turn your head slightly', 'Smile naturally'];
    const captures: string[] = [];

    try {
      for (const prompt of prompts) {
        setChallengeText(prompt);
        await wait(850);
        captures.push(await capturePhoto());
      }

      setChallengeText('Matching offline biometric template');
      await authenticate(captures);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed unexpectedly.';
      setActionError(message);
      setChallengeText('Verification failed. Try again.');
    }
  };

  const statusMessage = initError
    ? initError
    : cameraReady
      ? ready
        ? challengeText
        : 'Preparing offline models'
      : 'Camera not ready';

  return (
    <View style={styles.container}>
      <View style={styles.cameraPanel}>
        {device && hasPermission ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={canCapture || !enrolled}
            photo
            video={false}
            audio={false}
          />
        ) : (
          <View style={styles.cameraFallback}>
            <Text style={styles.cameraFallbackTitle}>
              {hasPermission ? 'Front camera unavailable' : 'Camera permission needed'}
            </Text>
            <Text style={styles.cameraFallbackText}>
              {hasPermission
                ? 'Use a device or emulator with a front camera enabled.'
                : 'Allow camera access to run offline face verification.'}
            </Text>
            {!hasPermission ? (
              <Pressable style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Allow Camera</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        <View style={styles.faceOval} />
        <Text style={styles.cameraText}>{statusMessage}</Text>
      </View>

      <View style={styles.statusPanel}>
        <Text style={styles.title}>Offline Field Authentication</Text>
        <Text style={styles.subtitle}>
          {enrolled
            ? 'Blink, turn your head, and smile. Matching runs fully offline on this device.'
            : 'First enroll your face offline. The template stays on this device.'}
        </Text>

        <View style={styles.metricsRow}>
          <Metric label="Model" value="TFLite" />
          <Metric label="Target" value="< 1 sec" />
          <Metric label="Mode" value="Offline" />
        </View>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        {lastError ? <Text style={styles.error}>{lastError.reason}</Text> : null}
        {lastResult ? (
          <Text style={styles.success}>
            Verified {lastResult.userId} in {lastResult.durationMs} ms
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canCapture}
          style={({ pressed }) => [
            styles.button,
            !canCapture && styles.buttonDisabled,
            pressed && canCapture && styles.buttonPressed
          ]}
          onPress={enrolled ? verifyCurrentFace : enrollCurrentFace}
        >
          {busy || !ready ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{enrolled ? 'Verify Face' : 'Enroll Face'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function wait(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 18
  },
  cameraPanel: {
    flex: 1,
    minHeight: 330,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#111827'
  },
  cameraFallbackTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  cameraFallbackText: {
    color: '#d1d9e0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center'
  },
  permissionButton: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
    backgroundColor: '#23c483'
  },
  permissionButtonText: {
    color: '#06281c',
    fontSize: 15,
    fontWeight: '800'
  },
  faceOval: {
    width: 210,
    height: 270,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: '#23c483',
    backgroundColor: 'rgba(35,196,131,0.08)'
  },
  cameraText: {
    position: 'absolute',
    bottom: 24,
    color: '#d7fbe8',
    fontSize: 16,
    fontWeight: '600'
  },
  statusPanel: {
    gap: 14
  },
  title: {
    color: '#101820',
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: '#44505c',
    fontSize: 15,
    lineHeight: 21
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10
  },
  metric: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d9e2e7'
  },
  metricValue: {
    color: '#101820',
    fontSize: 17,
    fontWeight: '800'
  },
  metricLabel: {
    color: '#6b7785',
    marginTop: 2
  },
  button: {
    minHeight: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e'
  },
  buttonDisabled: {
    opacity: 0.65
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }]
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800'
  },
  error: {
    color: '#b42318',
    fontWeight: '700'
  },
  success: {
    color: '#067647',
    fontWeight: '800'
  }
});
