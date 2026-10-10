import React, { useState } from 'react';

export interface AdminOrder {
  id: string;
  number: number;
  createdAt: string;
  status: string;
  customer: { name: string; phone: string; address: string };
  items: { sareeId: string; sku: string; name: string; colour: string; price: number; quantity: number; image: string }[];
  coupon: string;
  discountPercent: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const colour: Record<string, string> = {
  new: 'border-[#c89d42] text-[#8a6a1c] bg-[#fdf6e3]',
  confirmed: 'border-[#2b5d8a] text-[#2b5d8a] bg-[#e8f1f9]',
  shipped: 'border-[#6b4a8a] text-[#6b4a8a] bg-[#f1eaf7]',
  delivered: 'border-[#173629] text-[#173629] bg-[#e4f1e8]',
  cancelled: 'border-[#801319] text-[#801319] bg-[#f8e3e3]'
};

export const AdminOrders: React.FC<{
  orders: AdminOrder[] | null;
  onStatus: (o: AdminOrder, status: string) => void;
}> = ({ orders, onStatus }) => {
  const [filter, setFilter] = useState('all');

  if (orders === null) return <p className="p-6 text-sm text-[#756F66]">Loading…</p>;

  const count = (st: string) => orders.filter((o) => o.status === st).length;
  const shown = orders.filter((o) => filter === 'all' || o.status === filter);

  const chip = (key: string, text: string, n: number) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border cursor-pointer ${
        filter === key ? 'bg-[#181512] text-white border-[#181512]' : 'bg-white text-[#756F66] border-[#E5DFD5] hover:text-[#181512]'
      }`}
    >
      {text} ({n})
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {chip('all', 'All', orders.length)}
        {STATUSES.map((st) => chip(st, st, count(st)))}
      </div>

      {shown.length === 0 && (
        <p className="bg-white border border-[#E5DFD5] p-6 text-sm text-[#756F66]">No orders here yet.</p>
      )}

      {shown.map((o) => (
        <article key={o.id} className="bg-white border border-[#E5DFD5]">
          <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#E5DFD5]">
            <div>
              <p className="font-semibold">#SBT-{o.number}</p>
              <p className="text-xs text-[#756F66]">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <select
              value={o.status}
              onChange={(e) => onStatus(o, e.target.value)}
              className={`text-[11px] uppercase tracking-widest border px-2 py-1.5 cursor-pointer ${colour[o.status] || ''}`}
              aria-label="Order status"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4">
            <div className="space-y-1 text-sm">
              <p className="text-[11px] uppercase tracking-widest text-[#756F66]">Customer</p>
              <p className="font-serif text-lg leading-tight">{o.customer.name}</p>
              <p>
                <a href={`tel:+91${o.customer.phone}`} className="underline">
                  {o.customer.phone}
                </a>{' '}
                ·{' '}
                <a
                  href={`https://wa.me/91${o.customer.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#128C7E] underline"
                >
                  WhatsApp
                </a>
              </p>
              <p className="text-[#756F66] whitespace-pre-line">{o.customer.address}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-[#756F66]">Items</p>
              {o.items.map((i, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img src={i.image} alt="" referrerPolicy="no-referrer" className="w-10 h-12 object-cover bg-[#EAE5DC]" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="text-[11px] uppercase tracking-widest text-[#c89d42] font-semibold">{i.sku}</p>
                    <p className="truncate">
                      {i.name}
                      {i.colour ? ` · ${i.colour}` : ''}
                    </p>
                  </div>
                  <p className="text-sm whitespace-nowrap">
                    {i.quantity} × ₹{i.price.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
              <div className="pt-2 border-t border-[#E5DFD5] text-sm space-y-0.5">
                <div className="flex justify-between text-[#756F66]">
                  <span>Subtotal</span>
                  <span>₹{o.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {o.discount > 0 && (
                  <div className="flex justify-between text-[#173629]">
                    <span>Coupon {o.coupon} ({o.discountPercent}%)</span>
                    <span>- ₹{o.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#756F66]">
                  <span>Shipping</span>
                  <span>{o.shipping === 0 ? 'Free' : `₹${o.shipping}`}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Total</span>
                  <span>₹{o.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
