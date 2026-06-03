import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFaceGuardContext } from '../faceguard';
import { PendingAuthRecord } from '../types/faceguard';

type Props = NativeStackScreenProps<any, 'Logs'>;

export default function LogsScreen({ navigation }: Props) {
  const { queue } = useFaceGuardContext();
  const [logs, setLogs] = useState<PendingAuthRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    queue.listPending().then(records => {
      if (mounted) setLogs(records);
    });
    return () => { mounted = false; };
  }, [queue]);

  const renderItem = ({ item }: { item: PendingAuthRecord }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.logId} numberOfLines={1}>Record: {item.queueId?.split('-')[0]}</Text>
        <View style={styles.badgePending}>
          <Text style={styles.badgeText}>Offline Pending</Text>
        </View>
      </View>
      <Text style={styles.logTime}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
      <View style={styles.logDetails}>
        <Text style={styles.detailText}>Score: {(item.score * 100).toFixed(1)}%</Text>
        <Text style={styles.detailText}>Liveness: {(item.livenessScore * 100).toFixed(1)}%</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Logs</Text>
        <Text style={styles.headerSubtitle}>End-to-End Encrypted</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.queueId!}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No offline logs pending sync.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 }
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
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
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
  },
  listContainer: {
    padding: 24,
  },
  logItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  badgePending: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  backButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  }
});
