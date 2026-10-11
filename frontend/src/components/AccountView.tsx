import React, { useEffect, useState } from 'react';
import { Saree } from '../types';
import { useAuth } from '../store/AuthContext';
import { useStore } from '../store/StoreContext';

interface AccountViewProps {
  onContinue: () => void;
  onSelectSaree: (saree: Saree) => void;
}

const field =
  'w-full bg-white border border-[#E5DFD5] px-3 py-2.5 text-sm focus:outline-none focus:border-[#c89d42]';
const lbl = 'block text-[11px] uppercase tracking-widest text-[#756F66] mb-1';
const btn =
  'px-6 py-3 bg-[#181512] text-white text-[11px] uppercase tracking-luxury hover:bg-[#c89d42] hover:text-[#181512] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

/* ---------- logged out: login / create account ---------- */
const AuthForms: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (mode === 'login') await login(phone, password);
      else await register({ name, phone, email, address, password });
      onDone();
    } catch (ex: any) {
      setErr(ex.message === 'Failed to fetch' ? 'Cannot reach the server. Please try again.' : ex.message);
    } finally {
      setBusy(false);
    }
  };

  const tab = (m: 'login' | 'register', text: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        setErr('');
      }}
      className={`flex-1 py-3 text-[12px] uppercase tracking-luxury border-b-2 cursor-pointer ${
        mode === m ? 'border-[#181512] text-[#181512] font-semibold' : 'border-transparent text-[#756F66]'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="max-w-md mx-auto bg-white border border-[#E5DFD5] p-6 sm:p-8">
      <div className="flex mb-6 border-b border-[#E5DFD5]">
        {tab('login', 'Login')}
        {tab('register', 'Create account')}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className={lbl}>Full name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} required />
          </div>
        )}
        <div>
          <label className={lbl}>Mobile number *</label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="98765 43210"
            className={field}
            required
          />
        </div>
        {mode === 'register' && (
          <>
            <div>
              <label className={lbl}>Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
            </div>
            <div>
              <label className={lbl}>Delivery address (optional)</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" rows={3} className={field} />
            </div>
          </>
        )}
        <div>
          <label className={lbl}>Password *</label>
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={mode === 'register' ? 'At least 8 characters' : ''}
            className={field}
            required
          />
          <label className="flex items-center gap-2 mt-2 text-xs text-[#756F66] cursor-pointer select-none">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-[#c89d42]" />
            Show password
          </label>
        </div>

        {err && <p className="text-sm text-[#801319]">{err}</p>}

        <button type="submit" disabled={busy} className={`${btn} w-full`}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>

        {mode === 'register' && (
          <p className="text-[11px] text-[#756F66] text-center">
            Your details are used only for your orders and to save your favourites.
          </p>
        )}
      </form>
    </div>
  );
};

/* ---------- logged in: profile + favourites ---------- */
const Profile: React.FC<AccountViewProps> = ({ onContinue, onSelectSaree }) => {
  const { user, logout, updateProfile, setFavourites, getToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/me/orders', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((j) => setOrders(j.orders || []))
      .catch(() => {});
  }, [user?.id]);
  const { sarees } = useStore();
  const [name, setName] = useState(user!.name);
  const [email, setEmail] = useState(user!.email);
  const [address, setAddress] = useState(user!.address);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const favs = sarees.filter((s) => user!.favourites.includes(s.id));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      await updateProfile({ name, email, address });
      setMsg('Saved.');
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <form onSubmit={save} className="lg:col-span-4 bg-white border border-[#E5DFD5] p-6 space-y-4 self-start">
        <h2 className="font-serif text-xl text-[#181512]">My details</h2>
        <div>
          <label className={lbl}>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} required />
        </div>
        <div>
          <label className={lbl}>Mobile number</label>
          <input value={user!.phone} disabled className={`${field} bg-[#F5F0E8] text-[#756F66]`} />
        </div>
        <div>
          <label className={lbl}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label className={lbl}>Delivery address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={field} />
        </div>
        {err && <p className="text-sm text-[#801319]">{err}</p>}
        {msg && <p className="text-sm text-[#173629]">{msg}</p>}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className={btn}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={logout} className="text-[11px] uppercase tracking-luxury text-[#801319] cursor-pointer">
            Log out
          </button>
        </div>
      </form>

      <div className="lg:col-span-8">
        <div className="flex items-end justify-between mb-5 pb-4 border-b border-[#E5DFD5]">
          <h2 className="font-serif text-2xl text-[#181512]">
            My favourites <span className="text-sm text-[#756F66] font-sans">({favs.length})</span>
          </h2>
          <button onClick={onContinue} className="text-[11px] uppercase tracking-luxury border-b border-[#181512] pb-0.5 cursor-pointer hover:text-[#c89d42] hover:border-[#c89d42]">
            Continue shopping →
          </button>
        </div>

        {favs.length === 0 ? (
          <p className="py-12 text-center text-[#756F66]">
            No favourites yet. Tap the heart on any saree to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favs.map((s) => (
              <div key={s.id} className="bg-white border border-[#E5DFD5]">
                <div onClick={() => onSelectSaree(s)} className="aspect-[3/4] bg-[#EAE5DC] overflow-hidden cursor-pointer">
                  <img src={s.mainImage} alt={s.name} referrerPolicy="no-referrer" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-3">
                  <p className="text-[11px] uppercase tracking-widest text-[#c89d42] font-semibold">{s.sku}</p>
                  <p className="font-serif text-base leading-snug">{s.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-serif">₹ {s.price.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => setFavourites(user!.favourites.filter((id) => id !== s.id))}
                      aria-label="Remove from favourites"
                      className="cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#801319] font-fill">favorite</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl text-[#181512] mb-5 pb-4 border-b border-[#E5DFD5]">My orders</h2>
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.number} className="bg-white border border-[#E5DFD5] p-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">#SBT-{o.number}</p>
                    <p className="text-xs text-[#756F66]">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs mt-1">
                      {o.items.map((i: any) => `${i.sku}${i.colour ? ' (' + i.colour + ')' : ''} × ${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg">₹ {o.total.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] uppercase tracking-widest text-[#c89d42] font-semibold">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AccountView: React.FC<AccountViewProps> = (props) => {
  const { user, ready } = useAuth();

  return (
    <div className="w-full bg-[#FAF7F2] py-12 lg:py-16 min-h-[60vh]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#181512] mb-8 text-center lg:text-left">
          {user ? `Hello, ${user.name.split(' ')[0]}` : 'Login or create an account'}
        </h1>
        {!ready ? null : user ? <Profile {...props} /> : <AuthForms onDone={() => window.scrollTo({ top: 0 })} />}
      </div>
    </div>
  );
};
