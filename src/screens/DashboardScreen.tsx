import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFaceGuardContext } from '../faceguard/FaceGuardProvider';
import { RootStackParamList } from '../navigation/RootNavigator';

// 1. Bring in the navigation props so we can route back
type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>; 
// (Make sure 'Dashboard' matches your actual route name in your RootNavigator!)

export function DashboardScreen({ navigation }: Props) {
  const { queue, syncService } = useFaceGuardContext();
  const [pending, setPending] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Awaiting connectivity');
  
  // 2. Add a loading state for the network request
  const [isSyncing, setIsSyncing] = useState(false); 

  const refresh = useCallback(async () => {
    setPending(await queue.countPending());
  }, [queue]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sync = async () => {
    if (isSyncing) return; // Prevent double-taps
    
    setIsSyncing(true);
    setSyncMessage('Syncing with central database...');
    
    try {
      const result = await syncService.syncWhenOnline();
      setSyncMessage(`Uploaded ${result.uploaded}; purged ${result.purged}`);
    } catch {
      setSyncMessage('Sync failed. Record stays encrypted in the offline queue.');
    } finally {
      await refresh();
      setIsSyncing(false); // Turn off the loading spinner
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Field Session Verified</Text>
      <Text style={styles.copy}>Attendance proof is encrypted locally until the device reconnects.</Text>

      <View style={styles.panel}>
        <Text style={styles.count}>{pending}</Text>
        <Text style={styles.label}>pending offline record{pending === 1 ? '' : 's'}</Text>
      </View>

      {/* 3. The Sync Button (Now with Loading Spinner) */}
      <Pressable 
        style={[styles.button, isSyncing && styles.buttonDisabled]} 
        onPress={sync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sync & Purge</Text>
        )}
      </Pressable>
      
      <Text style={styles.syncText}>{syncMessage}</Text>

      {/* 4. The Loop Back Button */}
      <Pressable 
        style={styles.secondaryButton} 
        onPress={() => navigation.replace('Auth')} // Routes back to your Camera screen
      >
        <Text style={styles.secondaryButtonText}>Verify Next Person</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 18 },
  heading: { color: '#101820', fontSize: 26, fontWeight: '800' },
  copy: { color: '#44505c', fontSize: 16, lineHeight: 22 },
  panel: { borderRadius: 8, backgroundColor: '#ffffff', padding: 20, borderWidth: 1, borderColor: '#d9e2e7' },
  count: { color: '#0f766e', fontSize: 42, fontWeight: '900' },
  label: { color: '#44505c', fontSize: 16 },
  button: { minHeight: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101820' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },
  syncText: { color: '#44505c', fontWeight: '600' },
  secondaryButton: { 
    minHeight: 54, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#101820',
    marginTop: 'auto', // Pushes this button to the bottom of the screen
    marginBottom: 20
  },
  secondaryButtonText: { color: '#101820', fontSize: 17, fontWeight: '800' }
});