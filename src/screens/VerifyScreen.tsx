import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceAuth } from '../hooks/useFaceAuth';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Verify'>;

export function VerifyScreen({ navigation }: Props) {
  // True only while this screen is the active foreground screen
  const [isFocused, setIsFocused] = useState(false);
  // Delayed-active: stays false for 900ms after focus to let the outgoing
  // screen fully release camera hardware before we try to seize it.
  const [cameraActive, setCameraActive] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      setCameraInitialized(false);
      setCameraError(undefined);
      const timeout = setTimeout(() => setCameraActive(true), 900);
      return () => {
        setIsFocused(false);
        setCameraActive(false);
        setCameraInitialized(false);
        clearTimeout(timeout);
      };
    }, [])
  );

  const { authenticate, enrolled, ready, status, lastError, lastResult } = useFaceAuth();
  const cameraRef = useRef<Camera>(null);
  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = frontDevice ?? backDevice;
  const format = React.useMemo(() => {
    if (!device) return undefined;
    const sorted = [...device.formats].sort((a, b) => (a.photoWidth * a.photoHeight) - (b.photoWidth * b.photoHeight));
    return sorted.find(f => f.photoWidth >= 480) ?? sorted[0];
  }, [device]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const permissionRequested = useRef(false);
  const [challengeText, setChallengeText] = useState('Verify your identity to proceed');
  const [cameraError, setCameraError] = useState<string | undefined>();
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  // Request permission once on mount
  useEffect(() => {
    if (!hasPermission && !permissionRequested.current) {
      permissionRequested.current = true;
      requestPermission().catch(console.warn);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When app returns from background (e.g. after granting permission in Settings),
  // or when permission is granted via the system dialog while screen is focused,
  // re-trigger the camera activation with a small delay for the OS to settle.
  useEffect(() => {
    if (!hasPermission || !isFocused) return;
    // Permission just became true while we're on screen — restart camera
    setCameraInitialized(false);
    setCameraError(undefined);
    setCameraActive(false);
    const timeout = setTimeout(() => setCameraActive(true), 300);
    return () => clearTimeout(timeout);
  }, [hasPermission]); // eslint-disable-line react-hooks/exhaustive-deps
  // NOTE: intentionally omit isFocused — we only want this to fire when
  // hasPermission changes, not on every focus/blur cycle.

  // Handle app coming back to foreground (e.g. user went to Settings to grant permission)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isFocused && hasPermission) {
        setCameraInitialized(false);
        setCameraError(undefined);
        setCameraActive(false);
        const timeout = setTimeout(() => setCameraActive(true), 500);
        return () => clearTimeout(timeout);
      }
    });
    return () => sub.remove();
  }, [isFocused, hasPermission]);

  // Animation
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => navigation.replace('Dashboard'), 600);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [lastResult, navigation]);

  const busy = status === 'detecting-face' || status === 'checking-liveness' || status === 'matching-face';
  const cameraReady = Boolean(device && hasPermission && !cameraError && cameraInitialized && cameraRef.current);

  const capturePhoto = async (retries = 5, delayMs = 300): Promise<string> => {
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        if (!cameraRef.current) throw new Error('Camera is not ready.');
        const photo = await cameraRef.current.takePhoto({ flash: 'off', enableShutterSound: false });
        return photo.path;
      } catch (error) {
        if (attempt === retries) throw error;
        console.warn(`Camera capture attempt ${attempt} failed, retrying in ${delayMs}ms...`, error);
        await wait(delayMs);
      }
    }
    throw new Error('Camera is not ready.');
  };

  const verifyCurrentFace = async () => {
    const prompts = ['Blink once', 'Turn your head slightly', 'Smile naturally'];
    const captures: string[] = [];
    try {
      for (const prompt of prompts) {
        setChallengeText(prompt);
        await wait(750);
        captures.push(await capturePhoto());
      }
      setChallengeText('Authenticating...');
      await authenticate(captures);
    } catch (error) {
      console.warn('Verification failed:', error);
      setChallengeText('Verification failed: Camera error');
    }
  };

  const showCamera = device && hasPermission && cameraActive;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EdgeAuth</Text>
      </View>

      <View style={styles.cameraSection}>
        <View style={styles.cameraWrapper}>
          {showCamera ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              format={format}
              isActive={true}
              photo
              video={false}
              audio={false}
              onInitialized={() => {
                setCameraError(undefined);
                setCameraInitialized(true);
              }}
              onError={error => {
                setCameraError(error.message);
                setCameraInitialized(false);
              }}
            />
          ) : (
            <View style={styles.cameraFallback}>
              <Text style={styles.cameraFallbackTitle}>
                {cameraError ? 'Camera Error' : hasPermission ? 'Initializing...' : 'Access Required'}
              </Text>
              {(!hasPermission || cameraError) ? (
                <Pressable
                  style={styles.permissionButton}
                  onPress={async () => {
                    permissionRequested.current = true;
                    setCameraError(undefined);
                    setRequestingPermission(true);
                    try {
                      await requestPermission();
                    } finally {
                      setRequestingPermission(false);
                    }
                  }}
                >
                  <Text style={styles.permissionButtonText}>Allow Camera</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
        <Animated.View style={[styles.scanningRing, { opacity: pulseAnim }]} pointerEvents="none" />
      </View>

      <View style={styles.statusPanel}>
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>
          {cameraReady ? (ready ? challengeText : 'Preparing models...') : 'System initializing...'}
        </Text>
        <Text style={styles.instruction}>
          Position your face within the frame and look into the camera.
        </Text>

        <View style={styles.feedbackContainer}>
          {lastError ? <Text style={styles.error}>{lastError.reason}</Text> : null}
          {lastResult ? (
            <Text style={styles.success}>Identity Confirmed ({lastResult.durationMs}ms)</Text>
          ) : null}
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            accessibilityRole="button"
            disabled={!ready || busy || !cameraReady || requestingPermission}
            style={({ pressed }) => [
              styles.primaryButton,
              (!ready || busy || !cameraReady || requestingPermission) && styles.buttonDisabled,
              pressed && styles.buttonPressed
            ]}
            onPress={verifyCurrentFace}
          >
            {busy || !ready || requestingPermission ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Authenticate</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.replace('Enroll')}
          >
            <Text style={styles.secondaryButtonText}>Re-enroll Identity</Text>
          </Pressable>

          <Text style={[styles.footerText, { marginTop: 16, marginBottom: 0 }]}>Using biometric data for secure login.</Text>
        </View>
      </View>
    </View>
  );
}

function wait(ms: number) {
  return new Promise(resolve => { setTimeout(resolve, ms); });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingBottom: 10, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.5 },
  cameraSection: { alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20, height: 300 },
  cameraWrapper: { width: 280, height: 280, borderRadius: 40, overflow: 'hidden', backgroundColor: '#F2F2F7' },
  scanningRing: { position: 'absolute', width: 296, height: 296, borderRadius: 48, borderWidth: 4, borderColor: '#007AFF' },
  cameraFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F2F2F7' },
  cameraFallbackTitle: { color: '#8E8E93', fontSize: 16, fontWeight: '500', textAlign: 'center', marginBottom: 16 },
  permissionButton: { height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#007AFF' },
  permissionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  statusPanel: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  title: { color: '#1C1C1E', fontSize: 24, fontWeight: '700', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { color: '#007AFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  instruction: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  feedbackContainer: { minHeight: 24, justifyContent: 'center', marginTop: 8 },
  error: { color: '#FF3B30', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  success: { color: '#34C759', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  buttonContainer: { width: '100%', marginTop: 16, marginBottom: 20, alignItems: 'center' },
  primaryButton: { width: '100%', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', marginBottom: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { transform: [{ scale: 0.98 }], backgroundColor: '#0056B3' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  footerText: { color: '#8E8E93', fontSize: 13, marginBottom: 16 },
  secondaryButton: { width: '100%', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#007AFF' },
  secondaryButtonText: { color: '#007AFF', fontSize: 17, fontWeight: '600' },
});
