import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { Category, Saree, SareeColor } from '../types';
import { getColors } from '../lib/colors';
import { Customer } from '../store/AuthContext';
import { AdminOrders, AdminOrder } from './AdminOrders';
import { AdminSecurity } from './AdminSecurity';
import { useStore } from '../store/StoreContext';

const TOKEN_KEY = 'sbt_admin_token';

/* ---------- helpers ---------- */
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';

async function resizeToBlob(file: File, maxDim: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read image'))), 'image/jpeg', 0.86)
  );
}

async function uploadImage(file: File, token: string): Promise<string> {
  const blob = await resizeToBlob(file, 1800);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${token}` },
    body: blob
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'Upload failed.');
  return j.url;
}

const input =
  'w-full bg-white border border-[#E5DFD5] px-3 py-2 text-sm focus:outline-none focus:border-[#c89d42]';
const label = 'block text-[11px] uppercase tracking-widest text-[#756F66] mb-1';
const btnDark =
  'px-5 py-2.5 bg-[#181512] text-white text-[11px] uppercase tracking-luxury hover:bg-[#c89d42] hover:text-[#181512] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const btnLight =
  'px-4 py-2 border border-[#181512] text-[#181512] text-[11px] uppercase tracking-luxury hover:bg-[#181512] hover:text-white transition-colors cursor-pointer';

/* ---------- image field ---------- */
const ImageField: React.FC<{
  title: string;
  value: string;
  onChange: (url: string) => void;
  token: string;
  wide?: boolean;
}> = ({ title, value, onChange, token, wide }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      onChange(await uploadImage(file, token));
    } catch (ex: any) {
      setErr(ex.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className={label}>{title}</span>
      <div className="flex gap-3 items-start">
        <div
          className={`${wide ? 'w-40 aspect-[16/9]' : 'w-24 aspect-[3/4]'} bg-[#EAE5DC] border border-[#E5DFD5] overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-[#756F66]`}
        >
          {value ? (
            <img src={value} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            'No image'
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className={`${btnLight} inline-block`}>
            {busy ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
            <input type="file" accept="image/*" onChange={pick} disabled={busy} className="hidden" />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')} className="ml-3 text-[11px] text-[#801319] underline cursor-pointer">
              Remove
            </button>
          )}
          {err && <p className="text-xs text-[#801319]">{err}</p>}
        </div>
      </div>
    </div>
  );
};

/* ---------- login ---------- */
const Login: React.FC<{ onLogin: (t: string) => void }> = ({ onLogin }) => {
  const [pw, setPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'Login failed.');
    return j;
  };

  const finish = (token: string) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    onLogin(token);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (!challenge) {
        const j = await post('/api/admin/login', { password: pw });
        if (j.need2fa) setChallenge(j.challenge);
        else finish(j.token);
      } else {
        const j = await post('/api/admin/login/2fa', { challenge, code });
        finish(j.token);
      }
    } catch (ex: any) {
      const msg = ex.message === 'Failed to fetch' ? 'Cannot reach the server.' : ex.message;
      setErr(msg);
      if (challenge && /expired/i.test(msg)) {
        setChallenge('');
        setCode('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-[#E5DFD5] shadow-[0_24px_80px_rgba(24,21,18,0.08)] p-7 sm:p-9 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-[#E5DFD5]">
          <div className="w-12 h-12 bg-[#181512] text-[#D9B565] flex items-center justify-center shrink-0">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#9B7936]">Sri Bhagyalakshmi Textiles</p>
            <h1 className="font-serif text-2xl text-[#181512]">Admin portal</h1>
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-[#181512]">Secure sign in</h2>
          <p className="text-xs leading-relaxed text-[#756F66]">Manage sarees, inventory, orders and customers. Authorized staff only.</p>
        </div>
        {!challenge ? (
          <div>
            <label htmlFor="admin-password" className={label}>Admin password</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#756F66]" />
              <input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoFocus autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} className={`${input} !pl-9 !pr-11`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#756F66] hover:text-[#181512]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="admin-2fa-code" className={label}>Authenticator or backup code</label>
            <input
              id="admin-2fa-code"
              name="code"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="text"
              autoComplete="one-time-code"
              placeholder="123456"
              className={`${input} tracking-widest text-center`}
            />
            <p className="text-[11px] text-[#756F66] mt-2">Lost your phone? Enter one of your backup codes instead.</p>
          </div>
        )}
        {err && <p role="alert" className="text-xs leading-relaxed text-[#801319] bg-[#f8e3e3] border border-[#e7c1c1] p-3">{err}</p>}
        <button type="submit" disabled={busy || (!challenge ? !pw : !code)} className={`${btnDark} w-full !py-3 flex items-center justify-center gap-2`}>
          {busy ? 'Checking…' : challenge ? 'Verify and continue' : 'Sign in securely'}
        </button>
        <p className="flex items-center justify-center gap-2 text-[10px] text-[#756F66]"><ShieldCheck size={13} /> Protected admin access · Never share your password or backup codes</p>
        {challenge && (
          <button
            type="button"
            onClick={() => {
              setChallenge('');
              setCode('');
              setErr('');
            }}
            className="block w-full text-center text-[11px] uppercase tracking-luxury text-[#756F66] hover:text-[#181512] cursor-pointer"
          >
            ← Start again
          </button>
        )}
        <a href="#/" className="block text-center text-[11px] uppercase tracking-luxury text-[#756F66] hover:text-[#181512]">
          ← Back to shop
        </a>
      </form>
    </div>
  );
};

/* ---------- category form ---------- */
const CategoryForm: React.FC<{
  initial: Category | null;
  token: string;
  onCancel: () => void;
  onSave: (c: Category) => Promise<void>;
}> = ({ initial, token, onCancel, onSave }) => {
  const [name, setName] = useState(initial?.name || '');
  const [shortName, setShortName] = useState(initial?.shortName || '');
  const [image, setImage] = useState(initial?.heroImage || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr('Category name is required.');
    setBusy(true);
    setErr('');
    try {
      await onSave({
        id: initial?.id || '',
        name: name.trim(),
        shortName: shortName.trim() || name.trim(),
        count: 0,
        startingPrice: 0,
        provenance: initial?.provenance || '',
        description: initial?.description || '',
        heroImage: image,
        features: initial?.features || []
      });
    } catch (ex: any) {
      setErr(ex.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-[#E5DFD5] p-6 space-y-5 max-w-2xl">
      <h3 className="font-serif text-xl text-[#181512]">{initial ? 'Edit category' : 'New category'}</h3>
      <div>
        <span className={label}>Category name *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
      </div>
      <div>
        <span className={label}>Short name (shown on buttons)</span>
        <input value={shortName} onChange={(e) => setShortName(e.target.value)} className={input} placeholder={name} />
      </div>
      <ImageField title="Cover photo" value={image} onChange={setImage} token={token} />
      {err && <p className="text-sm text-[#801319]">{err}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={btnDark}>
          {busy ? 'Saving…' : 'Save category'}
        </button>
        <button type="button" onClick={onCancel} className={btnLight}>
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ---------- saree form ---------- */
const SareeForm: React.FC<{
  initial: Saree | null;
  categories: Category[];
  defaultCategoryId: string;
  token: string;
  onCancel: () => void;
  onSave: (s: Saree) => Promise<void>;
}> = ({ initial, categories, defaultCategoryId, token, onCancel, onSave }) => {
  const [sku, setSku] = useState(initial?.sku || '');
  const [name, setName] = useState(initial?.name || '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || defaultCategoryId);
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  // Existing catalogue items have no recorded count yet. Blank keeps them in legacy mode until the admin enters a real opening quantity.
  const [stockQuantity, setStockQuantity] = useState(initial?.stockQuantity === undefined ? (initial ? '' : '0') : String(initial.stockQuantity));
  const [mainImage, setMainImage] = useState(initial?.mainImage || '');
  const [fullImage, setFullImage] = useState(initial?.fullSareeLayImage || '');
  const [extras, setExtras] = useState<string[]>(
    (initial?.galleryImages || []).filter((g) => g.url !== initial?.mainImage).map((g) => g.url)
  );
  const [colors, setColors] = useState<SareeColor[]>(initial ? getColors(initial) : []);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [extraBusy, setExtraBusy] = useState(false);

  const addExtra = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setExtraBusy(true);
    setErr('');
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadImage(f, token));
      setExtras((prev) => [...prev, ...urls]);
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setExtraBusy(false);
    }
  };

  const addColor = () =>
    setColors((prev) => [
      ...prev,
      { id: 'c' + Date.now().toString(36) + prev.length, name: '', hex: '#8b1e2d', image: '', fullImage: '' }
    ]);
  const patchColor = (id: string, patch: Partial<SareeColor>) =>
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(price);
    if (!sku.trim()) return setErr('Saree code is required.');
    if (!name.trim()) return setErr('Name is required.');
    if (!categoryId) return setErr('Choose a category.');
    if (price === '' || !isFinite(p) || p < 0) return setErr('Enter a valid price.');
    if (stockQuantity !== '' && (!Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0 || Number(stockQuantity) > 1000000)) return setErr('Stock must be a whole number from 0 to 1,000,000.');
    if (!mainImage) return setErr('Upload the main saree photo.');
    if (colors.some((c) => !c.name.trim())) return setErr('Give every colour a name.');
    const names = colors.map((c) => c.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) return setErr('Two colours have the same name.');

    const cat = categories.find((c) => c.id === categoryId)!;
    const base: Saree =
      initial ||
      ({
        id: 'sbt-' + Date.now().toString(36),
        subtitle: '',
        weightGrams: 0,
        weaverOrigin: '',
        loomType: '',
        silkMarkVerified: false,
        description: '',
        weaveStory: '',
        fullSareeDetails: {
          palluLength: '',
          palluMotifs: '',
          bodyPattern: '',
          borderType: '',
          blouseIncluded: false,
          blouseLength: '',
          zariPurity: ''
        },
        tags: [],
        colorName: '',
        colorHex: '#000000',
        careGuide: []
      } as unknown as Saree);

    setBusy(true);
    setErr('');
    try {
      await onSave({
        ...base,
        sku: sku.trim(),
        name: name.trim(),
        categoryId,
        category: cat.name,
        price: p,
        originalPrice: initial && initial.originalPrice > p ? initial.originalPrice : p,
        ...(stockQuantity === '' ? {} : { stockQuantity: Number(stockQuantity), inStock: Number(stockQuantity) > 0 }),
        ...(stockQuantity === '' ? { inStock: initial?.inStock ?? true } : {}),
        mainImage,
        fullSareeLayImage: fullImage,
        colors: colors.map((c) => ({ ...c, name: c.name.trim() })),
        colorName: colors[0]?.name.trim() || '',
        colorHex: colors[0]?.hex || '#000000',
        galleryImages: [
          { id: 'main', url: mainImage, title: name.trim(), caption: '' },
          ...extras.map((url, i) => ({ id: `x${i}`, url, title: name.trim(), caption: '' }))
        ]
      });
    } catch (ex: any) {
      setErr(ex.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-[#E5DFD5] p-6 space-y-6 max-w-3xl">
      <h3 className="font-serif text-xl text-[#181512]">{initial ? `Edit ${initial.sku}` : 'New saree'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className={label}>Saree code *</span>
          <input value={sku} onChange={(e) => setSku(e.target.value)} className={input} placeholder="e.g. SBT-SILK-09" />
        </div>
        <div>
          <span className={label}>Price (₹) *</span>
          <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
        </div>
        <div className="sm:col-span-2">
          <span className={label}>Name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <div>
          <span className={label}>Category *</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={label}>Stock quantity</span>
          <input
            type="number"
            min="0"
            max="1000000"
            step="1"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            className={input}
            placeholder={initial ? 'Enter opening count' : '0'}
            aria-describedby="stock-help"
          />
          <p id="stock-help" className="mt-1 text-[11px] leading-relaxed text-[#756F66]">
            Enter the number of pieces available. Each order reduces this count automatically. Zero means sold out. For existing items, enter the real count to enable tracking; leave blank only if you have not counted it yet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageField title="Saree photo *" value={mainImage} onChange={setMainImage} token={token} />
        <ImageField title="Full saree (rectangular) photo" value={fullImage} onChange={setFullImage} token={token} wide />
      </div>

      <div>
        <span className={label}>More photos (optional)</span>
        <div className="flex flex-wrap gap-3">
          {extras.map((url, i) => (
            <div key={url + i} className="relative w-20 aspect-[3/4] bg-[#EAE5DC] border border-[#E5DFD5]">
              <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setExtras((p) => p.filter((_, j) => j !== i))}
                aria-label="Remove photo"
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#181512] text-white text-xs leading-5 cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
          <label className={`${btnLight} self-start`}>
            {extraBusy ? 'Uploading…' : '+ Add photos'}
            <input type="file" accept="image/*" multiple onChange={addExtra} disabled={extraBusy} className="hidden" />
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={label + ' !mb-0'}>Colour options</span>
          <button type="button" onClick={addColor} className={btnLight}>
            + Add colour
          </button>
        </div>
        {colors.length === 0 && (
          <p className="text-xs text-[#756F66]">No colours added. Customers will see the saree as shown above.</p>
        )}
        <div className="space-y-3">
          {colors.map((c) => (
            <div key={c.id} className="border border-[#E5DFD5] p-4 space-y-4 bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => patchColor(c.id, { hex: e.target.value })}
                  aria-label="Colour"
                  className="w-10 h-10 p-0 border border-[#E5DFD5] bg-white cursor-pointer"
                />
                <input
                  value={c.name}
                  onChange={(e) => patchColor(c.id, { name: e.target.value })}
                  placeholder="Colour name, e.g. Royal Blue"
                  className={input}
                />
                <button
                  type="button"
                  onClick={() => setColors((prev) => prev.filter((x) => x.id !== c.id))}
                  className="text-[11px] uppercase tracking-luxury text-[#801319] cursor-pointer whitespace-nowrap"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageField title="Photo in this colour (optional)" value={c.image} onChange={(u) => patchColor(c.id, { image: u })} token={token} />
                <ImageField title="Full saree photo in this colour (optional)" value={c.fullImage} onChange={(u) => patchColor(c.id, { fullImage: u })} token={token} wide />
              </div>
            </div>
          ))}
        </div>
        {colors.length > 0 && (
          <p className="text-xs text-[#756F66] mt-2">
            If you leave a colour's photos empty, the saree photos above are used for it.
          </p>
        )}
      </div>

      {err && <p className="text-sm text-[#801319]">{err}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy || extraBusy} className={btnDark}>
          {busy ? 'Saving…' : 'Save saree'}
        </button>
        <button type="button" onClick={onCancel} className={btnLight}>
          Cancel
        </button>
      </div>
    </form>
  );
};

/* ---------- main portal ---------- */
export const AdminPortal: React.FC = () => {
  const { categories, sarees, save, reload: reloadStore, offline, loading } = useStore();
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [tab, setTab] = useState<'sarees' | 'categories' | 'orders' | 'customers' | 'security'>('orders');
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [tfaEnabled, setTfaEnabled] = useState<boolean | null>(null);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [editingCat, setEditingCat] = useState<Category | 'new' | null>(null);
  const [editingSaree, setEditingSaree] = useState<Saree | 'new' | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', { headers: authHeader });
      if (res.status === 401) return logout();
      const j = await res.json();
      setCustomers(j.customers || []);
    } catch {
      setError('Could not load customers.');
    }
  };

  useEffect(() => {
    if (token && tab === 'customers') loadCustomers();
  }, [tab, token]);

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: authHeader });
      if (res.status === 401) return logout();
      const j = await res.json();
      setOrders(j.orders || []);
    } catch {}
  };

  // Orders are loaded on login and refreshed every 30 seconds so new ones show up
  useEffect(() => {
    if (!token) return;
    loadOrders();
    const id = setInterval(loadOrders, 30000);
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/2fa/status', { headers: authHeader })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setTfaEnabled(j.enabled))
      .catch(() => {});
  }, [token]);

  const logout = () => {
    if (token) fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
  };

  const persist = async (next: { categories: Category[]; sarees: Saree[] }) => {
    try {
      await save(next, token);
    } catch (ex: any) {
      if (ex.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw ex;
    }
  };

  const flash = (msg: string) => {
    setError('');
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  if (!token) return <Login onLogin={setToken} />;

  const saveCategory = async (c: Category) => {
    let next: Category[];
    let nextSarees = sarees;
    if (c.id) {
      next = categories.map((x) => (x.id === c.id ? c : x));
      nextSarees = sarees.map((s) => (s.categoryId === c.id ? { ...s, category: c.name } : s));
    } else {
      if (categories.some((x) => x.name.toLowerCase() === c.name.toLowerCase())) {
        throw new Error('A category with this name already exists.');
      }
      let id = slug(c.name);
      while (categories.some((x) => x.id === id)) id += '-2';
      next = [...categories, { ...c, id }];
    }
    await persist({ categories: next, sarees: nextSarees });
    setEditingCat(null);
    flash('Category saved.');
  };

  const deleteCategory = async (c: Category) => {
    const n = sarees.filter((s) => s.categoryId === c.id).length;
    if (n > 0) {
      setError(`"${c.name}" still has ${n} saree${n === 1 ? '' : 's'}. Move or delete them first.`);
      return;
    }
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await persist({ categories: categories.filter((x) => x.id !== c.id), sarees });
      flash('Category deleted.');
    } catch (ex: any) {
      setError(ex.message);
    }
  };

  const saveSaree = async (s: Saree) => {
    const dup = sarees.find((x) => x.id !== s.id && x.sku.trim().toLowerCase() === s.sku.trim().toLowerCase());
    if (dup) throw new Error(`The code ${s.sku} is already used by "${dup.name}".`);
    const exists = sarees.some((x) => x.id === s.id);
    const next = exists ? sarees.map((x) => (x.id === s.id ? s : x)) : [...sarees, s];
    await persist({ categories, sarees: next });
    setEditingSaree(null);
    flash(exists ? 'Saree updated.' : 'Saree added.');
  };

  const deleteSaree = async (s: Saree) => {
    if (!confirm(`Delete ${s.sku} – ${s.name}?`)) return;
    try {
      await persist({ categories, sarees: sarees.filter((x) => x.id !== s.id) });
      flash('Saree deleted.');
    } catch (ex: any) {
      setError(ex.message);
    }
  };


  const resetCustomerPassword = async (c: Customer) => {
    const pw = prompt(`New password for ${c.name} (at least 8 characters):`);
    if (!pw) return;
    const res = await fetch(`/api/admin/customers/${c.id}/password`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) flash('Password changed. Share it with the customer.');
    else setError(j.error || 'Could not change the password.');
  };

  const deleteCustomer = async (c: Customer) => {
    if (!confirm(`Delete ${c.name} (${c.phone}) and their favourites? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/customers/${c.id}`, { method: 'DELETE', headers: authHeader });
    if (res.ok) {
      flash('Customer deleted.');
      loadCustomers();
    } else setError('Could not delete the customer.');
  };

  const downloadCsv = () => {
    const safe = (v: string) => {
      const t = /^[=+\-@\t\r]/.test(v) ? "'" + v : v; // stop spreadsheet formula injection
      return '"' + t.replace(/"/g, '""') + '"';
    };
    const code = (id: string) => sarees.find((x) => x.id === id)?.sku || id;
    const rows = [['Name', 'Phone', 'Email', 'Address', 'Joined', 'Favourites']].concat(
      (customers || []).map((c) => [
        c.name,
        c.phone,
        c.email,
        c.address,
        new Date(c.createdAt).toLocaleDateString('en-IN'),
        c.favourites.map(code).join(' ')
      ])
    );
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map(safe).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const setOrderStatus = async (o: AdminOrder, status: string) => {
    const before = orders;
    setOrders((prev) => prev && prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const res = await fetch(`/api/admin/orders/${o.id}`, {
      method: 'PUT',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      setOrders(before);
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Could not update the order.');
    } else {
      await reloadStore(); // cancellation can restock inventory
      await loadOrders();
    }
  };

  const newOrders = orders ? orders.filter((o) => o.status === 'new').length : 0;

  const shown = sarees.filter((s) => !filterCat || s.categoryId === filterCat);
  const tabBtn = (t: 'sarees' | 'categories' | 'orders' | 'customers' | 'security', text: string) => (
    <button
      onClick={() => {
        setTab(t);
        setEditingCat(null);
        setEditingSaree(null);
        setError('');
      }}
      className={`px-5 py-3 text-[12px] uppercase tracking-luxury border-b-2 cursor-pointer ${
        tab === t ? 'border-[#181512] text-[#181512] font-semibold' : 'border-transparent text-[#756F66] hover:text-[#181512]'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#181512]">
      <header className="bg-white border-b border-[#E5DFD5]">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-xl">Admin</span>
          <div className="flex items-center gap-5 text-[11px] uppercase tracking-luxury">
            <a href="#/" className="text-[#756F66] hover:text-[#181512]">
              View shop
            </a>
            <button onClick={logout} className="text-[#801319] cursor-pointer">
              Log out
            </button>
          </div>
        </div>
        <div className="max-w-[1100px] mx-auto px-6 flex overflow-x-auto whitespace-nowrap">
          {tabBtn('orders', newOrders ? `Orders (${newOrders} new)` : 'Orders')}
          {tabBtn('sarees', `Sarees (${sarees.length})`)}
          {tabBtn('categories', `Categories (${categories.length})`)}
          {tabBtn('customers', customers ? `Customers (${customers.length})` : 'Customers')}
          {tabBtn('security', 'Security')}
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
        {offline && !loading && (
          <p className="p-3 bg-[#fdf1d8] border border-[#e8cf94] text-sm">
            The shop server is not running, so changes cannot be saved. Start it with <code>npm run dev</code>.
          </p>
        )}
        {notice && <p className="p-3 bg-[#e4f1e8] border border-[#a9d3b7] text-sm">{notice}</p>}
        {error && <p className="p-3 bg-[#f8e3e3] border border-[#e2a9a9] text-sm">{error}</p>}

        {tab === 'categories' && (
          <>
            {editingCat ? (
              <CategoryForm
                initial={editingCat === 'new' ? null : editingCat}
                token={token}
                onCancel={() => setEditingCat(null)}
                onSave={saveCategory}
              />
            ) : (
              <>
                <button onClick={() => setEditingCat('new')} className={btnDark}>
                  + New category
                </button>
                <div className="bg-white border border-[#E5DFD5] divide-y divide-[#E5DFD5]">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 p-3">
                      <div className="w-12 h-14 bg-[#EAE5DC] overflow-hidden shrink-0">
                        {c.heroImage && <img src={c.heroImage} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-lg truncate">{c.name}</p>
                        <p className="text-xs text-[#756F66]">{sarees.filter((s) => s.categoryId === c.id).length} sarees</p>
                      </div>
                      <button onClick={() => setEditingCat(c)} className={btnLight}>
                        Edit
                      </button>
                      <button onClick={() => deleteCategory(c)} className="text-[11px] uppercase tracking-luxury text-[#801319] cursor-pointer">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tfaEnabled === false && tab !== 'security' && (
          <button
            onClick={() => setTab('security')}
            className="w-full text-left p-3 bg-[#fdf1d8] border border-[#e8cf94] text-sm cursor-pointer"
          >
            Your admin login is protected by a password only. <strong>Turn on 2-step login →</strong>
          </button>
        )}

        {tab === 'orders' && <AdminOrders orders={orders} onStatus={setOrderStatus} />}

        {tab === 'security' && (
          <AdminSecurity token={token} onChange={setTfaEnabled} onExpired={logout} />
        )}

        {tab === 'customers' && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={downloadCsv} disabled={!customers?.length} className={btnDark}>
                Download CSV
              </button>
            </div>
            <div className="bg-white border border-[#E5DFD5] divide-y divide-[#E5DFD5]">
              {customers === null && <p className="p-6 text-sm text-[#756F66]">Loading…</p>}
              {customers?.length === 0 && <p className="p-6 text-sm text-[#756F66]">No customers have signed up yet.</p>}
              {customers?.map((c) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-[220px]">
                      <p className="font-serif text-lg leading-tight">{c.name}</p>
                      <p className="text-sm">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                      {c.address && <p className="text-xs text-[#756F66] mt-1 whitespace-pre-line">{c.address}</p>}
                      <p className="text-[11px] text-[#756F66] mt-1">
                        Joined {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <button onClick={() => resetCustomerPassword(c)} className={btnLight}>
                      Reset password
                    </button>
                    <button onClick={() => deleteCustomer(c)} className="text-[11px] uppercase tracking-luxury text-[#801319] cursor-pointer self-center">
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-[#756F66]">
                      Favourites ({c.favourites.length}):
                    </span>
                    {c.favourites.map((id) => (
                      <span key={id} className="text-[11px] px-2 py-0.5 border border-[#E5DFD5] bg-[#FAF7F2]">
                        {sarees.find((x) => x.id === id)?.sku || 'removed saree'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'sarees' && (
          <>
            {editingSaree ? (
              <SareeForm
                initial={editingSaree === 'new' ? null : editingSaree}
                categories={categories}
                defaultCategoryId={filterCat || categories[0]?.id || ''}
                token={token}
                onCancel={() => setEditingSaree(null)}
                onSave={saveSaree}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => (categories.length ? setEditingSaree('new') : setError('Create a category first.'))}
                    className={btnDark}
                  >
                    + New saree
                  </button>
                  <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={`${input} !w-auto`}>
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white border border-[#E5DFD5] divide-y divide-[#E5DFD5]">
                  {shown.length === 0 && <p className="p-6 text-sm text-[#756F66]">No sarees here yet.</p>}
                  {shown.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-4 p-3">
                      <div className="w-12 h-16 bg-[#EAE5DC] overflow-hidden shrink-0">
                        <img src={s.mainImage} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover object-top" />
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-[11px] uppercase tracking-widest text-[#c89d42] font-semibold">{s.sku}</p>
                        <p className="font-serif text-lg leading-tight">{s.name}</p>
                        <p className="text-xs text-[#756F66]">{s.category}</p>
                        <div className="flex gap-1 mt-1">
                          {getColors(s).map((c) => (
                            <span key={c.id} title={c.name} style={{ backgroundColor: c.hex }} className="w-3.5 h-3.5 rounded-full border border-[#E5DFD5]" />
                          ))}
                        </div>
                      </div>
                      <p className="font-serif text-lg w-24 text-right">₹ {s.price.toLocaleString('en-IN')}</p>
                      <span
                        className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
                          s.inStock ? 'border-[#173629] text-[#173629]' : 'border-[#801319] text-[#801319]'
                        }`}
                        title={s.stockQuantity === undefined ? 'Inventory count not configured' : `${s.stockQuantity} pieces remaining`}
                      >
                        {s.stockQuantity === undefined ? (s.inStock ? 'Count not set' : 'Sold out') : `${s.stockQuantity} in stock`}
                      </span>
                      <button onClick={() => setEditingSaree(s)} className={btnLight}>
                        Edit
                      </button>
                      <button onClick={() => deleteSaree(s)} className="text-[11px] uppercase tracking-luxury text-[#801319] cursor-pointer">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};
