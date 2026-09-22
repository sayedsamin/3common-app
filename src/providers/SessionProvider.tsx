import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { setApiKey } from '@/lib/api-session';
import { restoreApiKey, saveApiKey, removeApiKey } from '@/modules/auth/storage';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn' | 'error';
type Session = {
  status: SessionStatus;
  signIn: (apiKey: string) => Promise<void>;
  signOut: () => Promise<void>;
  retryRestore: () => void;
};
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const isChanging = useRef(false);
  useEffect(() => {
    let isActive = true;
    setApiKey(null);
    void restoreApiKey().then(key => {
      if (!isActive) return;
      setApiKey(key);
      setStatus(key ? 'signedIn' : 'signedOut');
    }).catch(() => { if (isActive) setStatus('error'); });
    return () => { isActive = false; setApiKey(null); };
  }, [attempt]);
  const signIn = useCallback(async (value: string) => {
    if (isChanging.current) return;
    isChanging.current = true;
    try {
      const key = await saveApiKey(value);
      await client.cancelQueries();
      client.clear();
      setApiKey(key);
      setStatus('signedIn');
    } finally { isChanging.current = false; }
  }, [client]);
  const signOut = useCallback(async () => {
    if (isChanging.current) return;
    isChanging.current = true;
    try {
      await removeApiKey();
      setApiKey(null);
      await client.cancelQueries();
      client.clear();
      setStatus('signedOut');
    } finally { isChanging.current = false; }
  }, [client]);
  return <SessionContext.Provider value={{ status, signIn, signOut, retryRestore: () => { setStatus('loading'); setAttempt(value => value + 1); } }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession requires SessionProvider.');
  return session;
}
