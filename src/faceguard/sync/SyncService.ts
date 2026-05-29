import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue } from '../storage/OfflineQueue';

export type SyncResponse = {
  acknowledgedIds: string[];
  serverAckToken: string;
};

export type SyncClient = {
  upload(records: unknown[]): Promise<SyncResponse>;
};

export class AwsSyncClient implements SyncClient {
  constructor(private readonly endpoint = 'https://api.example.datalake.local/faceguard/sync') {}

  async upload(records: unknown[]): Promise<SyncResponse> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ records })
    });

    if (!response.ok) {
      throw new Error(`Sync failed with ${response.status}`);
    }

    return (await response.json()) as SyncResponse;
  }
}

export class DemoSyncClient implements SyncClient {
  async upload(records: Array<{ queueId?: string }>): Promise<SyncResponse> {
    return {
      acknowledgedIds: records.map(record => record.queueId).filter(Boolean) as string[],
      serverAckToken: `demo-ack-${Date.now()}`
    };
  }
}

export class SyncService {
  constructor(
    private readonly queue: OfflineQueue,
    private readonly client: SyncClient = new DemoSyncClient()
  ) {}

  async syncWhenOnline(): Promise<{ uploaded: number; purged: number }> {
    const network = await NetInfo.fetch();
    if (!network.isConnected || !network.isInternetReachable) {
      return { uploaded: 0, purged: 0 };
    }

    const pending = await this.queue.listPending();
    const queueIds = pending.map(record => record.queueId);
    await this.queue.markSyncing(queueIds);

    try {
      const response = await this.client.upload(pending);
      await this.queue.purgeSynced(response.acknowledgedIds);
      return {
        uploaded: pending.length,
        purged: response.acknowledgedIds.length
      };
    } catch (error) {
      await this.queue.markFailed(queueIds);
      throw error;
    }
  }
}
