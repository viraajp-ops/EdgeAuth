import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FaceGuardProvider } from './src/faceguard/FaceGuardProvider';

export default function App() {
  return (
    <FaceGuardProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </FaceGuardProvider>
  );
}
