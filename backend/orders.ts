import { Express, Request, Response, RequestHandler } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { normalizePhone } from './auth.js';

export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type Status = (typeof ORDER_STATUSES)[number];

interface OrderItem {
  sareeId: string;
  sku: string;
  name: string;
  colour: string;
  price: number;
  quantity: number;
  image: string;
}
interface Order {
  id: string;
  number: number;
  createdAt: string;
  status: Status;
  customer: { name: string; phone: string; address: string };
  userId: string | null;
  items: OrderItem[];
  coupon: string;
  discountPercent: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

// "LOOM10:10,WEAVER10:10" = code:percent. Override with the COUPONS environment variable
// (set COUPONS="" to switch coupons off).
function loadCoupons(): Record<string, number> {
  const raw = process.env.COUPONS ?? 'LOOM10:10,WEAVER10:10';
  const out: Record<string, number> = {};
  for (const part of raw.split(',')) {
    const [code, pct] = part.split(':');
    const p = Number(pct);
    if (code && code.trim() && p >= 1 && p <= 90) out[code.trim().toUpperCase()] = p;
  }
  return out;
}

export function setupOrders(
  app: Express,
  dataDir: string,
  requireAdmin: RequestHandler,
  readStore: () => Promise<{ categories: any[]; sarees: any[] }>,
  writeStore: (store: { categories: any[]; sarees: any[] }) => Promise<void>,
  userIdFromReq: (req: Request) => string | null
) {
  const file = path.join(dataDir, 'orders.json');
  const COUPONS = loadCoupons();
  let orders: Order[] = [];
  try {
    orders = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    /* first run */
  }
  const persist = () => {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(orders), { mode: 0o600 });
    fs.renameSync(tmp, file);
  };

  const hits = new Map<string, number[]>();
  const limited = (key: string, max: number, windowMs: number) => {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    hits.set(key, arr);
    return arr.length >= max;
  };
  const hit = (key: string) => hits.set(key, [...(hits.get(key) || []), Date.now()]);
  setInterval(() => hits.clear(), 60 * 60 * 1000).unref();

  const str = (v: unknown, max: number): string | null =>
    typeof v === 'string' && v.trim().length <= max ? v.trim() : null;

  /* ---- coupon check (the discount itself is always recalculated when the order is placed) ---- */
  app.post('/api/coupon', (req, res) => {
    if (process.env.ORDERS_ENABLED !== 'true') return res.status(503).json({ error: 'Online ordering is temporarily unavailable.' });
    const ip = req.ip || 'x';
    if (limited('coupon:' + ip, 15, 10 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many tries. Please wait a few minutes.' });
    }
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const percent = COUPONS[code];
    if (!percent) {
      hit('coupon:' + ip);
      return res.status(404).json({ error: 'Invalid coupon code.' });
    }
    res.json({ percent });
  });

  /* ---- place an order ---- */
  app.post('/api/orders', async (req: Request, res: Response) => {
    if (process.env.ORDERS_ENABLED !== 'true') return res.status(503).json({ error: 'Online ordering is temporarily unavailable.' });
    const ip = req.ip || 'x';
    if (limited('order:' + ip, 10, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many orders from this device. Please try again later.' });
    }

    const b = req.body || {};
    const name = str(b.customer?.name, 100);
    const phone = normalizePhone(b.customer?.phone);
    const address = str(b.customer?.address, 500);
    if (!name) return res.status(400).json({ error: 'Please enter your name.' });
    if (!phone) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    if (!address || address.length < 5) return res.status(400).json({ error: 'Please enter your delivery address.' });

    if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 30) {
      return res.status(400).json({ error: 'Your bag is empty.' });
    }

    const { sarees } = await readStore();
    const items: OrderItem[] = [];
    for (const raw of b.items) {
      const qty = raw?.quantity;
      if (typeof raw?.id !== 'string' || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return res.status(400).json({ error: 'Invalid item in your bag.' });
      }
      const [sareeId, colorId] = raw.id.split('::');
      const saree = sarees.find((s) => s.id === sareeId);
      if (!saree) return res.status(409).json({ error: 'An item in your bag is no longer available. Please remove it.' });
      if (!saree.inStock || (typeof saree.stockQuantity === 'number' && saree.stockQuantity <= 0)) return res.status(409).json({ error: `${saree.sku} is sold out. Please remove it from your bag.` });

      let colour = '';
      let image = saree.mainImage as string;
      if (colorId) {
        const c = Array.isArray(saree.colors) ? saree.colors.find((x: any) => x.id === colorId) : null;
        if (c) {
          colour = c.name;
          image = c.image || image;
        } else if (colorId === 'default' && saree.colorName) {
          colour = saree.colorName;
        } else {
          return res.status(409).json({ error: `A colour of ${saree.sku} is no longer available. Please remove it.` });
        }
      }
      // price always comes from the shop's catalogue, never from the browser
      const existing = items.find((i) => i.sareeId === saree.id && i.colour === colour);
      if (existing) existing.quantity += qty;
      else items.push({ sareeId: saree.id, sku: saree.sku, name: saree.name, colour, price: saree.price, quantity: qty, image });
    }
    if (items.some((i) => i.quantity > 20)) return res.status(400).json({ error: 'Quantity too high.' });

    let coupon = '';
    let percent = 0;
    if (typeof b.coupon === 'string' && b.coupon.trim()) {
      const code = b.coupon.trim().toUpperCase();
      if (!COUPONS[code]) return res.status(400).json({ error: 'Invalid coupon code.' });
      coupon = code;
      percent = COUPONS[code];
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = Math.round((subtotal * percent) / 100);
    const shipping = subtotal >= 2500 ? 0 : 150;
    const total = subtotal - discount + shipping;

    // Check requested quantities against tracked stock before creating the order.
    // Legacy items without stockQuantity remain compatible until an opening count is entered in the admin portal.
    for (const item of items) {
      const saree = sarees.find((s) => s.id === item.sareeId)!;
      if (typeof saree.stockQuantity === 'number' && item.quantity > saree.stockQuantity) {
        return res.status(409).json({ error: `Only ${saree.stockQuantity} piece(s) of ${saree.sku} remain. Please update your bag.` });
      }
    }

    const order: Order = {
      id: crypto.randomBytes(8).toString('hex'),
      number: orders.reduce((m, o) => Math.max(m, o.number), 1000) + 1,
      createdAt: new Date().toISOString(),
      status: 'new',
      customer: { name, phone, address },
      userId: userIdFromReq(req),
      items,
      coupon,
      discountPercent: percent,
      subtotal,
      discount,
      shipping,
      total
    };
    // Decrease inventory when the order is accepted. This handler is synchronous, so stock checks and writes
    // cannot interleave with another request in this Node process.
    const store = await readStore();
    const tracked = new Map<string, number>();
    for (const item of items) {
      const saree = store.sarees.find((s: any) => s.id === item.sareeId);
      if (saree && typeof saree.stockQuantity === 'number') {
        tracked.set(item.sareeId, (tracked.get(item.sareeId) || 0) + item.quantity);
      }
    }
    for (const [id, quantity] of tracked) {
      const saree = store.sarees.find((s: any) => s.id === id);
      if (!saree || saree.stockQuantity < quantity) {
        return res.status(409).json({ error: `Stock changed while placing your order. Please refresh your bag and try again.` });
      }
    }
    const previousStore = JSON.stringify(store);
    for (const [id, quantity] of tracked) {
      const saree = store.sarees.find((s: any) => s.id === id);
      saree.stockQuantity -= quantity;
      saree.inStock = saree.stockQuantity > 0;
    }
    try {
      if (tracked.size) await writeStore(store);
      orders.push(order);
      persist();
    } catch (err) {
      orders = orders.filter((o) => o.id !== order.id);
      if (tracked.size) {
        try { await writeStore(JSON.parse(previousStore)); } catch { /* preserve the original persistence error */ }
      }
      throw err;
    }
    hit('order:' + ip); // only orders that were really placed count toward the limit
    res.json({ order: { number: order.number, total, subtotal, discount, shipping, status: order.status } });
  });

  /* ---- customer: own orders ---- */
  app.get('/api/me/orders', (req, res) => {
    const uid = userIdFromReq(req);
    if (!uid) return res.status(401).json({ error: 'Please log in.' });
    res.set('Cache-Control', 'no-store');
    res.json({
      orders: orders
        .filter((o) => o.userId === uid)
        .slice(-50)
        .reverse()
        .map((o) => ({ number: o.number, createdAt: o.createdAt, status: o.status, total: o.total, items: o.items.map((i) => ({ sku: i.sku, name: i.name, colour: i.colour, quantity: i.quantity })) }))
    });
  });

  /* ---- admin ---- */
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ orders: [...orders].reverse() });
  });

  app.put('/api/admin/orders/:id', requireAdmin, async (req, res) => {
    const o = orders.find((x) => x.id === req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found.' });
    const status = req.body?.status;
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const previousStatus = o.status;
    let inventoryBefore: string | null = null;
    if (previousStatus !== status && (status === 'cancelled' || previousStatus === 'cancelled')) {
      const store = await readStore();
      inventoryBefore = JSON.stringify(store);
      for (const item of o.items) {
        const saree = store.sarees.find((s: any) => s.id === item.sareeId);
        if (!saree || typeof saree.stockQuantity !== 'number') continue;
        if (status === 'cancelled') {
          saree.stockQuantity += item.quantity;
          saree.inStock = true;
        } else {
          if (saree.stockQuantity < item.quantity) {
            return res.status(409).json({ error: `Cannot reopen this order: not enough stock remains for ${saree.sku}.` });
          }
          saree.stockQuantity -= item.quantity;
          saree.inStock = saree.stockQuantity > 0;
        }
      }
      await writeStore(store);
    }
    o.status = status;
    try {
      persist();
    } catch (err) {
      o.status = previousStatus;
      if (inventoryBefore !== null) {
        try { await writeStore(JSON.parse(inventoryBefore)); } catch { /* preserve the original persistence error */ }
      }
      throw err;
    }
    res.json({ ok: true });
  });
}
