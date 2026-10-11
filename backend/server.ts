import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import { CATEGORIES, SAREES_DATA } from './seed/sareesData';
import { setupAuth } from './auth';
import { setupOrders } from './orders';
import { generateSecret, otpauthUri, verifyTotp } from './twofa';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.argv.includes('--prod');
const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://textiles_user:change-me@database:5432/textiles';
const pool = new Pool({ connectionString: DATABASE_URL, max: 10 });
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

if (IS_PROD) {
  process.env.NODE_ENV = 'production'; // hides stack traces from error responses
  if (!process.env.ADMIN_PASSWORD || ADMIN_PASSWORD === 'admin123' || ADMIN_PASSWORD.length < 8) {
    console.error('Refusing to start: set ADMIN_PASSWORD to a strong password of at least 8 characters.');
    process.exit(1);
  }
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ---------- storage: PostgreSQL ---------- */
type AnyObj = Record<string, any>;
interface Store { categories: AnyObj[]; sarees: AnyObj[] }

async function initializeDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS store_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS saree_inventory (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    main_image TEXT NOT NULL,
    product_json JSONB NOT NULL
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS saree_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_json JSONB NOT NULL
  )`);
}

async function writeStore(store: Store): Promise<void> {
  const normalized = {
    categories: store.categories,
    sarees: store.sarees.map((s) => ({
      ...s,
      stockQuantity: Number.isInteger(s.stockQuantity) ? Math.max(0, s.stockQuantity) : undefined,
      inStock: Number.isInteger(s.stockQuantity) ? s.stockQuantity > 0 : s.inStock
    }))
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO store_state (id, payload, updated_at) VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP`, [JSON.stringify(normalized)]);
    await client.query('DELETE FROM saree_inventory');
    await client.query('DELETE FROM saree_categories');
    for (const category of normalized.categories) {
      await client.query('INSERT INTO saree_categories (id, name, category_json) VALUES ($1, $2, $3::jsonb)', [category.id, category.name, JSON.stringify(category)]);
    }
    for (const saree of normalized.sarees) {
      await client.query('INSERT INTO saree_inventory (id, sku, name, stock_quantity, main_image, product_json) VALUES ($1, $2, $3, $4, $5, $6::jsonb)', [saree.id, saree.sku, saree.name, Number.isInteger(saree.stockQuantity) ? saree.stockQuantity : 0, saree.mainImage || '', JSON.stringify(saree)]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
  // Human-readable snapshot retained in the persistent DATA_DIR for recovery.
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(normalized, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, STORE_FILE);
}

async function readStore(): Promise<Store> {
  const result = await pool.query('SELECT payload FROM store_state WHERE id = 1');
  if (result.rows[0]?.payload) return result.rows[0].payload as Store;
  // One-time migration from the previous JSON-backed version, if present.
  try {
    const legacy = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) as Store;
    if (Array.isArray(legacy.categories) && Array.isArray(legacy.sarees)) {
      await writeStore(legacy);
      return legacy;
    }
  } catch { /* first launch */ }
  const seed: Store = { categories: CATEGORIES as any, sarees: SAREES_DATA as any };
  await writeStore(seed);
  return seed;
}

const okUrl = (u: unknown) =>
  typeof u === 'string' && (u === '' || /^(https?:\/\/|\/uploads\/)/.test(u)) && u.length < 2000;

function tooBig(v: any, depth = 0): boolean {
  if (depth > 6) return true;
  if (typeof v === 'string') return v.length > 2000;
  if (Array.isArray(v)) return v.length > 5000 || v.some((x) => tooBig(x, depth + 1));
  if (v && typeof v === 'object') return Object.values(v).some((x) => tooBig(x, depth + 1));
  return false;
}

function validate(body: any): Store | string {
  if (tooBig(body)) return 'A value is too long.';
  if (!body || !Array.isArray(body.categories) || !Array.isArray(body.sarees)) return 'Invalid data.';
  if (body.categories.length > 200 || body.sarees.length > 5000) return 'Too many items.';

  const catIds = new Set<string>();
  for (const c of body.categories) {
    if (!c || typeof c.id !== 'string' || !c.id || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 100) {
      return 'Every category needs an id and a name (max 100 characters).';
    }
    if (catIds.has(c.id)) return `Duplicate category id: ${c.id}`;
    catIds.add(c.id);
    if (!okUrl(c.heroImage)) return `Bad image link on category "${c.name}".`;
  }

  const ids = new Set<string>();
  const skus = new Set<string>();
  for (const s of body.sarees) {
    if (!s || typeof s.id !== 'string' || typeof s.sku !== 'string' || !s.sku.trim()) return 'Every saree needs a code.';
    if (typeof s.name !== 'string' || !s.name.trim() || s.name.length > 200 || s.sku.length > 60) return `Saree ${s.sku} needs a name (max 200 characters) and a code (max 60).`;
    if (typeof s.price !== 'number' || !isFinite(s.price) || s.price < 0) return `Saree ${s.sku} has a bad price.`;
    if (s.stockQuantity !== undefined && (!Number.isInteger(s.stockQuantity) || s.stockQuantity < 0 || s.stockQuantity > 1000000)) return `Saree ${s.sku} stock must be a whole number from 0 to 1,000,000.`;
    if (s.stockQuantity !== undefined) s.inStock = s.stockQuantity > 0;
    if (!catIds.has(s.categoryId)) return `Saree ${s.sku} is in a category that does not exist.`;
    if (ids.has(s.id)) return `Duplicate saree id: ${s.id}`;
    const key = s.sku.trim().toLowerCase();
    if (skus.has(key)) return `Duplicate saree code: ${s.sku}`;
    ids.add(s.id);
    skus.add(key);
    if (!okUrl(s.mainImage) || !okUrl(s.fullSareeLayImage)) return `Bad image link on ${s.sku}.`;
    if (s.colors !== undefined) {
      if (!Array.isArray(s.colors) || s.colors.length > 30) return `Bad colour list on ${s.sku}.`;
      for (const c of s.colors) {
        if (!c || typeof c.id !== 'string' || !c.id || typeof c.name !== 'string' || !c.name.trim()) return `Every colour on ${s.sku} needs a name.`;
        if (!/^#[0-9a-fA-F]{6}$/.test(c.hex)) return `Bad colour code on ${s.sku}.`;
        if (!okUrl(c.image ?? '') || !okUrl(c.fullImage ?? '')) return `Bad colour photo on ${s.sku}.`;
      }
    }
    if (!Array.isArray(s.galleryImages) || s.galleryImages.length > 30) return `Bad photo list on ${s.sku}.`;
    for (const g of s.galleryImages) if (!okUrl(g?.url)) return `Bad photo link on ${s.sku}.`;
  }
  return { categories: body.categories, sarees: body.sarees };
}

/* ---------- auth ---------- */
const sessions = new Map<string, number>();
const attempts = new Map<string, { n: number; until: number }>();
const DAY = 24 * 60 * 60 * 1000;

const digest = (s: string) => crypto.createHash('sha256').update(s).digest();

/* ---------- admin 2-step login (authenticator app) ---------- */
interface AdminCfg {
  twofa?: { secret: string; enabled: boolean; lastStep: number; backup: string[] };
}
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
let adminCfg: AdminCfg = {};
try {
  adminCfg = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
} catch {
  /* none yet */
}
function saveAdminCfg() {
  const tmp = ADMIN_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(adminCfg), { mode: 0o600 });
  fs.renameSync(tmp, ADMIN_FILE);
}
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const challenges = new Map<string, { exp: number; fails: number }>();
let pending: { secret: string; exp: number } | null = null;

function newAdminSession() {
  for (const [t, exp] of sessions) if (exp < Date.now()) sessions.delete(t);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + DAY);
  return token;
}

/** Accepts an authenticator code or a one-time backup code. */
function checkSecondFactor(input: unknown): boolean {
  const tf = adminCfg.twofa;
  if (!tf || !tf.enabled || typeof input !== 'string') return false;
  const code = input.replace(/[\s-]/g, '').toLowerCase();
  if (/^\d{6}$/.test(code)) {
    const step = verifyTotp(tf.secret, code, tf.lastStep);
    if (step === null) return false;
    tf.lastStep = step; // this code can never be used again
    saveAdminCfg();
    return true;
  }
  const h = sha(code);
  const i = tf.backup.indexOf(h);
  if (i === -1) return false;
  tf.backup.splice(i, 1); // backup codes work once
  saveAdminCfg();
  return true;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const exp = sessions.get(token);
  if (!token || !exp || exp < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Please log in again.' });
  }
  next();
}

/* ---------- app ---------- */
async function main() {
  const app = express();
  app.disable('x-powered-by');
  // Set TRUST_PROXY=1 when running behind a host's proxy (Render, Railway, Caddy, nginx...)
  // so login lockouts apply per visitor instead of to everyone at once.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    if (IS_PROD) {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'"
        ].join('; ')
      );
    }
    next();
  });

  app.get('/healthz', (_req, res) => res.type('text').send('ok'));
  app.use('/api', express.json({ limit: '2mb' }));

  app.get('/api/store', async (_req, res, next) => {
    try { res.set('Cache-Control', 'no-store'); res.json(await readStore()); } catch (e) { next(e); }
  });

  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || 'x';
    const rec = attempts.get(ip);
    if (rec && rec.until > Date.now()) {
      return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    }
    const given = typeof req.body?.password === 'string' ? req.body.password : '';
    if (crypto.timingSafeEqual(digest(given), digest(ADMIN_PASSWORD))) {
      attempts.delete(ip);
      if (adminCfg.twofa?.enabled) {
        for (const [c, v] of challenges) if (v.exp < Date.now()) challenges.delete(c);
        const challenge = crypto.randomBytes(24).toString('hex');
        challenges.set(challenge, { exp: Date.now() + 5 * 60 * 1000, fails: 0 });
        return res.json({ need2fa: true, challenge });
      }
      return res.json({ token: newAdminSession() });
    }
    const n = (rec?.n || 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
    res.status(401).json({ error: 'Wrong password.' });
  });

  /* ----- 2-step login ----- */
  const tfaLocked = (ip: string) => {
    const r = attempts.get('tfa:' + ip);
    return !!r && r.until > Date.now();
  };
  const tfaFail = (ip: string) => {
    const n = (attempts.get('tfa:' + ip)?.n || 0) + 1;
    attempts.set('tfa:' + ip, { n, until: n >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
  };

  app.post('/api/admin/login/2fa', (req, res) => {
    const ip = req.ip || 'x';
    if (tfaLocked(ip)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    const ch = typeof req.body?.challenge === 'string' ? challenges.get(req.body.challenge) : undefined;
    if (!ch || ch.exp < Date.now()) return res.status(401).json({ error: 'Login expired. Please start again.' });
    if (checkSecondFactor(req.body?.code)) {
      challenges.delete(req.body.challenge);
      attempts.delete('tfa:' + ip);
      return res.json({ token: newAdminSession() });
    }
    tfaFail(ip);
    if (++ch.fails >= 5) challenges.delete(req.body.challenge);
    res.status(401).json({ error: 'Wrong code.' });
  });

  app.get('/api/admin/2fa/status', requireAdmin, (_req, res) => {
    res.json({ enabled: !!adminCfg.twofa?.enabled, backupLeft: adminCfg.twofa?.backup.length || 0 });
  });

  app.post('/api/admin/2fa/setup', requireAdmin, (_req, res) => {
    if (adminCfg.twofa?.enabled) return res.status(400).json({ error: '2-step login is already on.' });
    pending = { secret: generateSecret(), exp: Date.now() + 10 * 60 * 1000 };
    res.json({ secret: pending.secret, uri: otpauthUri(pending.secret, 'admin', 'Sri Bhagyalakshmi Textiles') });
  });

  app.post('/api/admin/2fa/enable', requireAdmin, (req, res) => {
    const ip = req.ip || 'x';
    if (tfaLocked(ip)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    if (!pending || pending.exp < Date.now()) return res.status(400).json({ error: 'Setup expired. Start again.' });
    const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\s/g, '') : '';
    const step = verifyTotp(pending.secret, code, 0);
    if (step === null) {
      tfaFail(ip);
      return res.status(400).json({ error: 'That code is not right. Check the 6 digits in your app.' });
    }
    const plain = Array.from({ length: 8 }, () => {
      const h = crypto.randomBytes(5).toString('hex');
      return h.slice(0, 5) + '-' + h.slice(5);
    });
    adminCfg.twofa = { secret: pending.secret, enabled: true, lastStep: step, backup: plain.map((c) => sha(c.replace('-', ''))) };
    pending = null;
    saveAdminCfg();
    res.json({ backupCodes: plain });
  });

  app.post('/api/admin/2fa/disable', requireAdmin, (req, res) => {
    const ip = req.ip || 'x';
    if (tfaLocked(ip)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    const given = typeof req.body?.password === 'string' ? req.body.password : '';
    const pwOk = crypto.timingSafeEqual(digest(given), digest(ADMIN_PASSWORD));
    if (!pwOk || !checkSecondFactor(req.body?.code)) {
      tfaFail(ip);
      return res.status(401).json({ error: 'Password or code is wrong.' });
    }
    delete adminCfg.twofa;
    saveAdminCfg();
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (req, res) => {
    sessions.delete((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    res.json({ ok: true });
  });

  app.put('/api/admin/store', requireAdmin, async (req, res, next) => {
    const result = validate(req.body);
    if (typeof result === 'string') return res.status(400).json({ error: result });
    try { await writeStore(result); res.json({ ok: true }); } catch (error) {
      console.error('Database write failed:', error);
      return res.status(500).json({ error: 'Could not save catalogue to the database.' });
    }
  });

  app.post(
    '/api/admin/upload',
    requireAdmin,
    express.raw({ type: 'image/*', limit: '12mb' }),
    (req, res) => {
      const buf = req.body as Buffer;
      if (!Buffer.isBuffer(buf) || buf.length < 12) return res.status(400).json({ error: 'No image received.' });
      let ext = '';
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) ext = 'jpg';
      else if (buf.slice(0, 4).toString('hex') === '89504e47') ext = 'png';
      else if (buf.slice(0, 4).toString() === 'GIF8') ext = 'gif';
      else if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') ext = 'webp';
      if (!ext) return res.status(400).json({ error: 'Only JPG, PNG, GIF or WEBP images are allowed.' });
      const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      res.json({ url: `/uploads/${name}` });
    }
  );

  const { userIdFromReq } = setupAuth(app, DATA_DIR, requireAdmin);
  setupOrders(app, DATA_DIR, requireAdmin, readStore, writeStore, userIdFromReq);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      maxAge: '30d',
      immutable: true,
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
    })
  );

  // The frontend is served by the dedicated Nginx container.
  // This service only handles API routes and uploaded media.

  // Never leak stack traces or internals
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: status === 413 ? 'Too large.' : status < 500 ? 'Bad request.' : 'Server error.' });
  });

  await initializeDatabase();
  // Initialize/migrate the catalogue before accepting traffic.
  await readStore();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nShop:   http://localhost:${PORT}`);
    console.log(`Admin:  http://localhost:${PORT}/#/admin`);
    if (ADMIN_PASSWORD === 'admin123') {
      console.log('\n!! Using the default admin password. Create a .env file with ADMIN_PASSWORD=your-own-password\n');
    }
  });
}

main();
