import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  favourites: string[];
  createdAt: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  address: string;
  password: string;
}

interface AuthValue {
  user: Customer | null;
  ready: boolean;
  register: (d: RegisterData) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (d: { name: string; email: string; address: string }) => Promise<void>;
  setFavourites: (ids: string[]) => void;
  getToken: () => string;
}

const KEY = 'sbt_user_token';
const Ctx = createContext<AuthValue | null>(null);

async function call(path: string, method: string, token?: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(json.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return json;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef<string>('');
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const clear = useCallback(() => {
    tokenRef.current = '';
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    let t = '';
    try {
      t = localStorage.getItem(KEY) || '';
    } catch {}
    if (!t) {
      setReady(true);
      return;
    }
    tokenRef.current = t;
    call('/api/me', 'GET', t)
      .then((j) => setUser(j.user))
      .catch((e) => {
        if (e.status === 401) clear(); // expired or removed: log out quietly
      })
      .finally(() => setReady(true));
  }, [clear]);

  const startSession = (j: { token: string; user: Customer }) => {
    tokenRef.current = j.token;
    try {
      localStorage.setItem(KEY, j.token);
    } catch {}
    setUser(j.user);
  };

  const register = async (d: RegisterData) => startSession(await call('/api/auth/register', 'POST', undefined, d));
  const login = async (phone: string, password: string) =>
    startSession(await call('/api/auth/login', 'POST', undefined, { phone, password }));

  const logout = () => {
    const t = tokenRef.current;
    if (t) call('/api/auth/logout', 'POST', t).catch(() => {});
    clear();
  };

  const updateProfile = async (d: { name: string; email: string; address: string }) => {
    try {
      const j = await call('/api/me', 'PUT', tokenRef.current, d);
      setUser(j.user);
    } catch (e: any) {
      if (e.status === 401) clear();
      throw e;
    }
  };

  // Optimistic update; saves are sent one after another so the last tap always wins
  const setFavourites = (ids: string[]) => {
    setUser((u) => (u ? { ...u, favourites: ids } : u));
    const t = tokenRef.current;
    queue.current = queue.current.then(() =>
      call('/api/me/favourites', 'PUT', t, { ids }).catch((e) => {
        if (e.status === 401) clear();
        else call('/api/me', 'GET', t).then((j) => setUser(j.user)).catch(() => {});
      })
    );
  };

  return (
    <Ctx.Provider value={{ user, ready, register, login, logout, updateProfile, setFavourites, getToken: () => tokenRef.current }}>
      {children}
    </Ctx.Provider>
  );
};

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
