import { useState, useEffect, useCallback, useRef } from 'react';
import { verificarAPI, apiDisponible, forzarVerificacionAPI, setToken, getToken } from '../utils/apiClient';

interface SyncState {
  lastSync: Date | null;
  syncing: boolean;
  apiAvailable: boolean | null;
  unreadNotifications: number;
}

export function useApiStatus() {
  const [disponible, setDisponible] = useState<boolean | null>(apiDisponible());
  const [verificando, setVerificando] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: null,
    syncing: false,
    apiAvailable: null,
    unreadNotifications: 0,
  });

  const verificar = useCallback(async () => {
    setVerificando(true);
    forzarVerificacionAPI();
    const ok = await verificarAPI();
    setDisponible(ok);
    setSyncState(prev => ({ ...prev, apiAvailable: ok }));
    setVerificando(false);
    return ok;
  }, []);

  useEffect(() => {
    verificar();
    const interval = setInterval(verificar, 60_000);
    return () => clearInterval(interval);
  }, [verificar]);

  return { disponible, verificando, verificar, syncState };
}

export function usePolling(callback: () => Promise<void>, intervalMs: number = 30000) {
  const savedCallback = useRef(callback);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        await savedCallback.current();
      } catch {}
      timeoutId = setTimeout(tick, intervalMs);
      setIsRunning(true);
    };

    tick();
    return () => {
      clearTimeout(timeoutId);
      setIsRunning(false);
    };
  }, [intervalMs]);

  return { isRunning };
}

export function useNotifications(userId: string | undefined) {
  const [unread, setUnread] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!userId) return;

    const checkUnread = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch('/api/notificaciones?userId=' + encodeURIComponent(userId) + '&unread=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnread(data.count || 0);
        }
      } catch {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 30000);

    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [userId]);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return;
    try {
      const es = new EventSource('/api/notificaciones?accion=stream');
      es.addEventListener('calificaciones', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.count > 0) {
            checkUnread();
          }
        } catch {}
      });
      es.addEventListener('ping', (event) => {
        try {
          const data = JSON.parse(event.data);
          setUnread(data.unread || 0);
        } catch {}
      });
      eventSourceRef.current = es;
    } catch {}
  }, []);

  return { unread, connectSSE };
}