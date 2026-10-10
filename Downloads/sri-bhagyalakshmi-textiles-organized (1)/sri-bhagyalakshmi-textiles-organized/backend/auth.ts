import { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  pwSalt: string;
  pwHash: string;
  favourites: string[];
  createdAt: string;
}
interface Db {
  users: Record<string, User>;
  sessions: Record<string, { uid: string; exp: number }>; // key = sha256(token)
}

const DAY = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const MAX_SESSIONS_PER_USER = 10;

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

/** 10-digit Indian mobile number, accepting +91 / 91 / 0 prefixes. */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function setupAuth(app: Express, dataDir: string, requireAdmin: RequestHandler) {
  const file = path.join(dataDir, 'users.json');
  let db: Db = { users: {}, sessions: {} };
  try {
    db = JSON.parse(fs.readFileSync(file, 'utf8'));
    db.users ||= {};
    db.sessions ||= {};
  } catch {
    /* first run */
  }

  const persist = () => {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db), { mode: 0o600 }); // personal data: owner-only
    fs.renameSync(tmp, file);
  };

  /* ---------- simple in-memory rate limiter ---------- */
  const hits = new Map<string, number[]>();
  const limited = (key: string, max: number, windowMs: number) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    hits.set(key, arr);
    return arr.length >= max;
  };
  const hit = (key: string) => hits.set(key, [...(hits.get(key) || []), Date.now()]);
  setInterval(() => hits.clear(), 60 * 60 * 1000).unref();

  /* ---------- helpers ---------- */
  const hashPw = async (pw: string) => {
    const salt = crypto.randomBytes(16);
    const h = await scrypt(pw, salt, 64);
    return { pwSalt: salt.toString('hex'), pwHash: h.toString('hex') };
  };
  const DUMMY = { salt: crypto.randomBytes(16), hash: Buffer.alloc(64) };
  const checkPw = async (u: User | undefined, pw: string) => {
    const salt = u ? Buffer.from(u.pwSalt, 'hex') : DUMMY.salt; // same work for unknown phones
    const h = await scrypt(pw, salt, 64);
    const expected = u ? Buffer.from(u.pwHash, 'hex') : DUMMY.hash;
    return crypto.timingSafeEqual(h, expected) && !!u;
  };

  const pub = (u: User) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    address: u.address,
    favourites: u.favourites,
    createdAt: u.createdAt
  });

  const newSession = (uid: string) => {
    const now = Date.now();
    for (const [k, s] of Object.entries(db.sessions)) if (s.exp < now) delete db.sessions[k];
    const mine = Object.entries(db.sessions)
      .filter(([, s]) => s.uid === uid)
      .sort((a, b) => a[1].exp - b[1].exp);
    while (mine.length >= MAX_SESSIONS_PER_USER) delete db.sessions[mine.shift()![0]];
    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[sha(token)] = { uid, exp: now + SESSION_DAYS * DAY };
    return token;
  };

  const dropSessions = (uid: string) => {
    for (const [k, s] of Object.entries(db.sessions)) if (s.uid === uid) delete db.sessions[k];
  };

  const tokenOf = (req: Request) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  const userIdFromReq = (req: Request): string | null => {
    const t = tokenOf(req);
    const s = t ? db.sessions[sha(t)] : undefined;
    return s && s.exp >= Date.now() && db.users[s.uid] ? s.uid : null;
  };

  const requireUser = (req: Request, res: Response, next: NextFunction) => {
    const t = tokenOf(req);
    const s = t ? db.sessions[sha(t)] : undefined;
    if (!s || s.exp < Date.now() || !db.users[s.uid]) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    (req as any).uid = s.uid;
    next();
  };

  const cleanText = (v: unknown, max: number): string | null =>
    typeof v === 'string' && v.trim().length <= max ? v.trim() : null;

  const validEmail = (e: string) => e === '' || (e.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  /* ---------- customer routes ---------- */
  app.post('/api/auth/register', async (req, res) => {
    const ip = req.ip || 'x';
    if (limited('reg:' + ip, 10, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many sign-ups. Please try again later.' });
    }
    hit('reg:' + ip);

    const b = req.body || {};
    const name = cleanText(b.name, 100);
    const phone = normalizePhone(b.phone);
    const email = cleanText(b.email ?? '', 150);
    const address = cleanText(b.address ?? '', 500);
    const password = typeof b.password === 'string' ? b.password : '';

    if (!name) return res.status(400).json({ error: 'Please enter your name.' });
    if (!phone) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    if (email === null || !validEmail(email)) return res.status(400).json({ error: 'Enter a valid email or leave it empty.' });
    if (address === null) return res.status(400).json({ error: 'Address is too long.' });
    if (password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (Object.values(db.users).some((u) => u.phone === phone)) {
      return res.status(409).json({ error: 'This phone number already has an account. Please log in.' });
    }

    const user: User = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      phone,
      email,
      address,
      ...(await hashPw(password)),
      favourites: [],
      createdAt: new Date().toISOString()
    };
    // re-check after the async hash so two simultaneous sign-ups cannot share a number
    if (Object.values(db.users).some((u) => u.phone === phone)) {
      return res.status(409).json({ error: 'This phone number already has an account. Please log in.' });
    }
    db.users[user.id] = user;
    const token = newSession(user.id);
    persist();
    res.json({ token, user: pub(user) });
  });

  app.post('/api/auth/login', async (req, res) => {
    const ip = req.ip || 'x';
    const phone = normalizePhone(req.body?.phone);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const k1 = 'login-ip:' + ip;
    const k2 = 'login:' + ip + ':' + (phone || 'none');
    if (limited(k1, 20, 15 * 60 * 1000) || limited(k2, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    }
    const user = phone ? Object.values(db.users).find((u) => u.phone === phone) : undefined;
    const ok = password.length <= 200 && (await checkPw(user, password));
    if (!ok || !user) {
      hit(k1);
      hit(k2);
      return res.status(401).json({ error: 'Wrong phone number or password.' });
    }
    const token = newSession(user.id);
    persist();
    res.json({ token, user: pub(user) });
  });

  app.post('/api/auth/logout', (req, res) => {
    const t = tokenOf(req);
    if (t) {
      delete db.sessions[sha(t)];
      persist();
    }
    res.json({ ok: true });
  });

  app.get('/api/me', requireUser, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ user: pub(db.users[(req as any).uid]) });
  });

  app.put('/api/me', requireUser, (req, res) => {
    const u = db.users[(req as any).uid];
    const b = req.body || {};
    const name = cleanText(b.name, 100);
    const email = cleanText(b.email ?? '', 150);
    const address = cleanText(b.address ?? '', 500);
    if (!name) return res.status(400).json({ error: 'Please enter your name.' });
    if (email === null || !validEmail(email)) return res.status(400).json({ error: 'Enter a valid email or leave it empty.' });
    if (address === null) return res.status(400).json({ error: 'Address is too long.' });
    u.name = name;
    u.email = email;
    u.address = address;
    persist();
    res.json({ user: pub(u) });
  });

  app.put('/api/me/favourites', requireUser, (req, res) => {
    const ids = req.body?.ids;
    if (
      !Array.isArray(ids) ||
      ids.length > 500 ||
      ids.some((i) => typeof i !== 'string' || i.length === 0 || i.length > 100)
    ) {
      return res.status(400).json({ error: 'Invalid favourites.' });
    }
    const u = db.users[(req as any).uid];
    u.favourites = Array.from(new Set<string>(ids));
    persist();
    res.json({ favourites: u.favourites });
  });

  /* ---------- admin routes (customer data) ---------- */
  app.get('/api/admin/customers', requireAdmin, (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const list = Object.values(db.users)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(pub);
    res.json({ customers: list });
  });

  app.post('/api/admin/customers/:id/password', requireAdmin, async (req, res) => {
    const u = db.users[req.params.id];
    if (!u) return res.status(404).json({ error: 'Customer not found.' });
    const pw = typeof req.body?.password === 'string' ? req.body.password : '';
    if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    Object.assign(u, await hashPw(pw));
    dropSessions(u.id);
    persist();
    res.json({ ok: true });
  });

  app.delete('/api/admin/customers/:id', requireAdmin, (req, res) => {
    const u = db.users[req.params.id];
    if (!u) return res.status(404).json({ error: 'Customer not found.' });
    dropSessions(u.id);
    delete db.users[u.id];
    persist();
    res.json({ ok: true });
  });

  return { userIdFromReq };
}
