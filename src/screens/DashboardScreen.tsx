import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFaceGuardContext } from '../faceguard/FaceGuardProvider';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>; 

export function DashboardScreen({ navigation }: Props) {
  const { queue, syncService } = useFaceGuardContext();
  const [pending, setPending] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Data is encrypted on this device.');
  const [isSyncing, setIsSyncing] = useState(false); 

  const refresh = useCallback(async () => {
    setPending(await queue.countPending());
  }, [queue]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncMessage('Syncing with central database...');
    
    try {
      const result = await syncService.syncWhenOnline();
      setSyncMessage(`Uploaded ${result.uploaded} record(s); purged ${result.purged}`);
    } catch {
      setSyncMessage('Sync failed. Records remain encrypted offline.');
    } finally {
      await refresh();
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Field Session Complete</Text>
        <Text style={styles.subtitle}>
          Attendance proofs are securely encrypted locally until the device reconnects to a network.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardCount}>{pending}</Text>
          <Text style={styles.cardLabel}>Pending Offline Record{pending === 1 ? '' : 's'}</Text>
        </View>

        <Text style={styles.syncText}>{syncMessage}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={({ pressed }) => [
            styles.primaryButton, 
            isSyncing && styles.buttonDisabled,
            pressed && styles.buttonPressed
          ]} 
          onPress={sync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sync & Purge Data</Text>
          )}
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.6 }
          ]} 
          onPress={() => navigation.replace('Verify')}
        >
          <Text style={styles.secondaryButtonText}>Verify Next Subject</Text>
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.6 },
            { marginTop: 4 }
          ]} 
          onPress={() => navigation.navigate('Logs')}
        >
          <Text style={styles.secondaryButtonText}>View Offline Logs</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    color: '#1C1C1E',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardCount: {
    color: '#007AFF',
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
  },
  cardLabel: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  syncText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#0056B3',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '500',
  }
});