import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthStatus, FaceAuthFailure, FaceAuthResult } from '../types/faceguard';

type FaceGuardProps = {
  status: AuthStatus;
  result?: FaceAuthResult;
  error?: FaceAuthFailure;
  onVerify: () => void;
  disabled?: boolean;
};

export function FaceGuard({ status, result, error, onVerify, disabled }: FaceGuardProps) {
  const busy = status === 'detecting-face' || status === 'checking-liveness' || status === 'matching-face';

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <View style={styles.scanLine} />
        <View style={styles.faceGuide} />
      </View>
      <Text style={styles.title}>FaceGuard Offline Verification</Text>
      <Text style={styles.message}>
        {result
          ? `Verified ${result.userId}`
          : error?.reason ?? 'Complete the liveness challenge to authenticate.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || busy}
        style={[styles.button, (disabled || busy) && styles.buttonDisabled]}
        onPress={onVerify}
      >
        {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  preview: {
    height: 320,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#23c483',
    opacity: 0.7
  },
  faceGuide: {
    width: 190,
    height: 245,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#23c483'
  },
  title: {
    color: '#101820',
    fontSize: 21,
    fontWeight: '800'
  },
  message: {
    color: '#44505c',
    fontSize: 15,
    lineHeight: 21
  },
  button: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e'
  },
  buttonDisabled: {
    opacity: 0.65
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  }
});
