import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { CartItem } from '../types';
import { useStore } from '../store/StoreContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (sareeId: string, delta: number) => void;
  onRemoveItem: (sareeId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const { user, getToken } = useAuth();
  const { reload: reloadStore } = useStore();
  const [couponError, setCouponError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [placed, setPlaced] = useState<{ number: number; total: number } | null>(null);

  // Fill the delivery form from the customer's account
  useEffect(() => {
    if (!user) return;
    setCustomerName((v) => v || user.name);
    setCustomerPhone((v) => v || user.phone);
    setCustomerAddress((v) => v || user.address);
  }, [user?.id]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.saree.price * item.quantity, 0);
  const discountApplied = discountPercent > 0;
  const discount = Math.round((subtotal * discountPercent) / 100);
  const shipping = subtotal >= 2500 || items.length === 0 ? 0 : 150;
  const total = subtotal - discount + shipping;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!coupon.trim()) return;
    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Invalid coupon code.');
      setDiscountPercent(j.percent);
    } catch (ex: any) {
      setDiscountPercent(0);
      setCouponError(ex.message === 'Failed to fetch' ? 'Cannot reach the server.' : ex.message);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');
    setPlacing(true);
    try {
      const token = getToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          customer: { name: customerName, phone: customerPhone, address: customerAddress },
          items: items.map((i) => ({ id: i.saree.id, quantity: i.quantity })),
          coupon: discountApplied ? coupon : undefined
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not place the order. Please try again.');
      setPlaced({ number: j.order.number, total: j.order.total });
      setOrderConfirmed(true);
      await reloadStore();
      onClearCart();
      setDiscountPercent(0);
      setCoupon('');
    } catch (ex: any) {
      setOrderError(ex.message === 'Failed to fetch' ? 'Cannot reach the server. Please try again.' : ex.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between border-l border-[#E5DFD5] drawer-panel">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DFD5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#181512]">shopping_bag</span>
            <h2 className="font-serif text-xl text-[#181512]">Bag</h2>
            <span className="font-sans text-xs text-[#756F66]">({items.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#756F66] hover:text-[#181512] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {orderConfirmed ? (
            <div className="text-center py-10 space-y-4">
              <span className="w-12 h-12 rounded-full bg-[#173629] text-white flex items-center justify-center mx-auto text-2xl">
                ✓
              </span>
              <h3 className="font-serif text-2xl text-[#181512]">Order Confirmed</h3>
              <p className="font-sans text-xs text-[#756F66] max-w-xs mx-auto leading-relaxed">
                Order #SBT-{placed?.number} received. We will contact you to confirm it.
              </p>
              <div className="p-4 bg-white border border-[#E5DFD5] text-left text-xs space-y-1">
                <p><strong>Customer:</strong> {customerName}</p>
                <p><strong>Phone:</strong> {customerPhone}</p>
                <p><strong>Total Amount:</strong> ₹{(placed?.total ?? 0).toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => {
                  setOrderConfirmed(false);
                  setPlaced(null);
                  onClose();
                }}
                className="w-full py-3 bg-[#181512] text-white text-[11px] uppercase tracking-luxury hover:bg-[#c89d42] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-[#756F66]">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">inventory_2</span>
              <p className="font-serif text-lg text-[#181512]">Your Bag is Empty</p>
            </div>
          ) : (
            <>

              {/* Item List */}
              <div className="space-y-4">
                {items.map(({ saree, quantity }) => (
                  <div
                    key={saree.id}
                    className="flex gap-4 p-3 bg-white border border-[#E5DFD5] relative group"
                  >
                    <img
                      src={saree.mainImage}
                      alt={saree.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 object-cover bg-[#EAE5DC] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between pr-4">
                          <h4 className="font-serif text-sm text-[#181512] leading-tight font-medium">
                            {saree.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(saree.id)}
                            className="text-[#756F66] hover:text-[#801319] p-0.5 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                        <span className="font-sans text-[10px] text-[#756F66] block mt-0.5">
                          {saree.sku}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-[#E5DFD5]">
                          <button
                            onClick={() => onUpdateQuantity(saree.id, -1)}
                            className="px-2 py-0.5 text-xs text-[#756F66] hover:text-[#181512] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-medium text-[#181512]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(saree.id, 1)}
                            className="px-2 py-0.5 text-xs text-[#756F66] hover:text-[#181512] cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-serif text-base text-[#181512] font-medium">
                          ₹ {(saree.price * quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 bg-white border border-[#E5DFD5] px-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-[#c89d42]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 border border-[#181512] text-[#181512] text-[10px] uppercase tracking-luxury hover:bg-[#181512] hover:text-white transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {couponError && <p className="text-[11px] text-[#801319] -mt-4">{couponError}</p>}
              {discountApplied && (
                <p className="text-[11px] text-[#173629] font-medium -mt-4">
                  ✓ {discountPercent}% discount applied
                </p>
              )}

              {/* Simple Checkout Address Input */}
              <div className="p-4 bg-white border border-[#E5DFD5] space-y-3">
                <span className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] font-semibold block">
                  Delivery Details
                </span>
                <input
                  type="text"
                  placeholder="Name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5DFD5] px-3 py-1.5 text-xs focus:outline-none focus:border-[#c89d42]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5DFD5] px-3 py-1.5 text-xs focus:outline-none focus:border-[#c89d42]"
                />
                <textarea
                  placeholder="Delivery Address"
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5DFD5] px-3 py-1.5 text-xs focus:outline-none focus:border-[#c89d42]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Subtotal & Submit */}
        {!orderConfirmed && items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#E5DFD5] space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#756F66]">
                <span>Subtotal</span>
                <span className="font-mono">₹ {subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-[#173629]">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono">- ₹ {discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-[#756F66]">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹ ${shipping}`}</span>
              </div>
              <div className="flex justify-between text-base font-serif text-[#181512] pt-2 border-t border-[#E5DFD5]">
                <span>Total Amount</span>
                <span className="font-semibold">₹ {total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {orderError && <p className="text-xs text-[#801319]">{orderError}</p>}
            <button
              onClick={handleCheckout}
              disabled={!customerName || !customerPhone || !customerAddress || placing}
              className={`w-full py-3.5 text-[11px] uppercase tracking-luxury font-medium transition-colors text-center ${
                customerName && customerPhone && customerAddress && !placing
                  ? 'bg-[#181512] text-white hover:bg-[#c89d42] hover:text-[#181512] cursor-pointer'
                  : 'bg-[#E5DFD5] text-[#756F66] cursor-not-allowed'
              }`}
            >
              {placing
                ? 'Placing order…'
                : customerName && customerPhone && customerAddress
                ? 'Confirm Order'
                : 'Enter Name, Phone & Address'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
