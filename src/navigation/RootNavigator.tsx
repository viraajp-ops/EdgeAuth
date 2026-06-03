import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EnrollScreen } from '../screens/EnrollScreen';
import { VerifyScreen } from '../screens/VerifyScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import LogsScreen from '../screens/LogsScreen';

export type RootStackParamList = {
  Enroll: undefined;
  Verify: undefined;
  Dashboard: undefined;
  Logs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' }
      }}
      initialRouteName="Verify"
    >
      <Stack.Screen name="Enroll" component={EnrollScreen} options={{ title: 'Enroll Face' }} />
      <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Verify Face' }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Datalake 3.0' }} />
      <Stack.Screen name="Logs" component={LogsScreen} options={{ title: 'Offline Logs' }} />
    </Stack.Navigator>
  );
}
