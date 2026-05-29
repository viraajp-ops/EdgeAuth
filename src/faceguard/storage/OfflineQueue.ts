import * as SQLite from 'expo-sqlite';
import { v4 as uuid } from 'uuid';
import { FaceAuthResult, PendingAuthRecord } from '../../types/faceguard';
import { decryptJson, encryptJson } from '../security/crypto';

const DATABASE_NAME = 'faceguard.db';

export class OfflineQueue {
  private db = SQLite.openDatabaseSync(DATABASE_NAME);

  async initialize(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS auth_queue (
        queue_id TEXT PRIMARY KEY NOT NULL,
        encrypted_payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        sync_status TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  async enqueue(result: FaceAuthResult): Promise<PendingAuthRecord> {
    const queueId = uuid();
    const encryptedPayload = await encryptJson(result);
    await this.db.runAsync(
      `INSERT INTO auth_queue (queue_id, encrypted_payload, created_at, sync_status, retry_count)
       VALUES (?, ?, ?, 'pending', 0);`,
      [queueId, encryptedPayload, result.createdAt]
    );

    return {
      ...result,
      queueId,
      encryptedPayload,
      syncStatus: 'pending',
      retryCount: 0
    };
  }

  async listPending(): Promise<PendingAuthRecord[]> {
    const rows = await this.db.getAllAsync<{
      queue_id: string;
      encrypted_payload: string;
      sync_status: PendingAuthRecord['syncStatus'];
      retry_count: number;
    }>(
      `SELECT queue_id, encrypted_payload, sync_status, retry_count
       FROM auth_queue
       WHERE sync_status IN ('pending', 'failed')
       ORDER BY created_at ASC;`
    );

    return Promise.all(
      rows.map(async row => ({
        ...(await decryptJson<FaceAuthResult>(row.encrypted_payload)),
        queueId: row.queue_id,
        encryptedPayload: row.encrypted_payload,
        syncStatus: row.sync_status,
        retryCount: row.retry_count
      }))
    );
  }

  async markSyncing(queueIds: string[]): Promise<void> {
    await this.updateStatus(queueIds, 'syncing');
  }

  async markFailed(queueIds: string[]): Promise<void> {
    if (queueIds.length === 0) {
      return;
    }
    const placeholders = queueIds.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE auth_queue
       SET sync_status = 'failed', retry_count = retry_count + 1
       WHERE queue_id IN (${placeholders});`,
      queueIds
    );
  }

  async purgeSynced(queueIds: string[]): Promise<void> {
    if (queueIds.length === 0) {
      return;
    }
    const zeroFill = '0'.repeat(256);
    const placeholders = queueIds.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE auth_queue SET encrypted_payload = ?, sync_status = 'synced'
       WHERE queue_id IN (${placeholders});`,
      [zeroFill, ...queueIds]
    );
    await this.db.runAsync(`DELETE FROM auth_queue WHERE queue_id IN (${placeholders});`, queueIds);
  }

  async countPending(): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM auth_queue WHERE sync_status IN ('pending', 'failed');`
    );
    return row?.count ?? 0;
  }

  private async updateStatus(queueIds: string[], status: PendingAuthRecord['syncStatus']) {
    if (queueIds.length === 0) {
      return;
    }
    const placeholders = queueIds.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE auth_queue SET sync_status = ? WHERE queue_id IN (${placeholders});`,
      [status, ...queueIds]
    );
  }
}
