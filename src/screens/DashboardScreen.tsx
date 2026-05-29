import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFaceGuardContext } from '../faceguard/FaceGuardProvider';

export function DashboardScreen() {
  const { queue, syncService } = useFaceGuardContext();
  const [pending, setPending] = useState(0);
  const [syncMessage, setSyncMessage] = useState('Awaiting connectivity');

  const refresh = useCallback(async () => {
    setPending(await queue.countPending());
  }, [queue]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sync = async () => {
    try {
      const result = await syncService.syncWhenOnline();
      setSyncMessage(`Uploaded ${result.uploaded}; purged ${result.purged}`);
      await refresh();
    } catch {
      setSyncMessage('Sync failed. Record stays encrypted in the offline queue.');
      await refresh();
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

      <Pressable style={styles.button} onPress={sync}>
        <Text style={styles.buttonText}>Sync & Purge</Text>
      </Pressable>
      <Text style={styles.syncText}>{syncMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 18
  },
  heading: {
    color: '#101820',
    fontSize: 26,
    fontWeight: '800'
  },
  copy: {
    color: '#44505c',
    fontSize: 16,
    lineHeight: 22
  },
  panel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 20,
    borderWidth: 1,
    borderColor: '#d9e2e7'
  },
  count: {
    color: '#0f766e',
    fontSize: 42,
    fontWeight: '900'
  },
  label: {
    color: '#44505c',
    fontSize: 16
  },
  button: {
    minHeight: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101820'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800'
  },
  syncText: {
    color: '#44505c',
    fontWeight: '600'
  }
});
