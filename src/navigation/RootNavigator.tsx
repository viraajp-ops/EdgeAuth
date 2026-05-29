import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '../screens/AuthScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

export type RootStackParamList = {
  Auth: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#101820' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f4f7f8' }
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'FaceGuard' }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Datalake 3.0' }} />
    </Stack.Navigator>
  );
}
