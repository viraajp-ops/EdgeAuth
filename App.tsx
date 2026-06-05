import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Camera } from 'react-native-vision-camera';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { FaceGuardProvider } from './src/faceguard/FaceGuardProvider';

export default function App() {
  // Permission is handled at the screen level to sync with React state.

  return (
    <AppErrorBoundary>
      <FaceGuardProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </FaceGuardProvider>
    </AppErrorBoundary>
  );
}
