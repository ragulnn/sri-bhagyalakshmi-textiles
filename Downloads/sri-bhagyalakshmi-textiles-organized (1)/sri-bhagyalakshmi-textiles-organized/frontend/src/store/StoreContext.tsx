import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Category, Saree } from '../types';
import { CATEGORIES, SAREES_DATA } from '../data/sareesData';

export interface StoreData {
  categories: Category[];
  sarees: Saree[];
}

interface StoreValue extends StoreData {
  loading: boolean;
  offline: boolean;
  reload: () => Promise<void>;
  save: (next: StoreData, token: string) => Promise<void>;
}

const Ctx = createContext<StoreValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<StoreData>({ categories: CATEGORIES, sarees: SAREES_DATA });
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/store', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      const json = await res.json();
      setData({ categories: json.categories, sarees: json.sarees });
      setOffline(false);
    } catch {
      // No server (e.g. static hosting): fall back to the built-in sample data
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (next: StoreData, token: string) => {
    const res = await fetch('/api/admin/store', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(next)
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err: any = new Error(j.error || 'Could not save.');
      err.status = res.status;
      throw err;
    }
    setData(next);
  }, []);

  return <Ctx.Provider value={{ ...data, loading, offline, reload, save }}>{children}</Ctx.Provider>;
};

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
