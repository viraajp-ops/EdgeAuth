import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { FaceGuardEngine } from './FaceGuardEngine';
import { OfflineQueue } from './storage/OfflineQueue';
import { SyncService } from './sync/SyncService';

type FaceGuardContextValue = {
  engine: FaceGuardEngine;
  queue: OfflineQueue;
  syncService: SyncService;
  ready: boolean;
};

const FaceGuardContext = createContext<FaceGuardContextValue | undefined>(undefined);

export function FaceGuardProvider({ children }: PropsWithChildren) {
  const engine = useMemo(() => new FaceGuardEngine(), []);
  const queue = useMemo(() => new OfflineQueue(), []);
  const syncService = useMemo(() => new SyncService(queue), [queue]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([engine.initialize(), queue.initialize()]).then(() => {
      if (mounted) {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [engine, queue]);

  return (
    <FaceGuardContext.Provider value={{ engine, queue, syncService, ready }}>
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
