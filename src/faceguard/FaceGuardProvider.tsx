import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { FaceGuardEngine } from './FaceGuardEngine';
import { OfflineQueue } from './storage/OfflineQueue';
import { SyncService } from './sync/SyncService';

type FaceGuardContextValue = {
  queue: OfflineQueue;
  syncService: SyncService;
  engine: FaceGuardEngine;
  ready: boolean;
  initError: string | null;
};

const FaceGuardContext = createContext<FaceGuardContextValue | undefined>(undefined);

export function FaceGuardProvider({ children }: PropsWithChildren) {
  const queue = useMemo(() => new OfflineQueue(), []);
  const syncService = useMemo(() => new SyncService(queue), [queue]);
  const engine = useMemo(() => new FaceGuardEngine(), []);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await queue.initialize();
        await engine.initialize();

        if (mounted) {
          setInitError(null);
          setReady(true);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'FaceGuard failed to initialize offline services.';
        console.error('INIT ERROR:', error);
        if (mounted) {
          setInitError(message);
          setReady(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [engine, queue]);

  return (
    <FaceGuardContext.Provider value={{ queue, syncService, engine, ready, initError }}>
      {children}
    </FaceGuardContext.Provider>
  );
}

export function useFaceGuardContext(): FaceGuardContextValue {
  const context = useContext(FaceGuardContext);
  if (!context) {
    throw new Error('useFaceGuardContext must be used inside FaceGuardProvider.');
  }
  return context;
}
