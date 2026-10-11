import React from 'react';
import { Saree } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistSarees: Saree[];
  onRemoveWishlist: (sareeId: string) => void;
  onSelectSaree: (saree: Saree) => void;
  onAddToCart: (saree: Saree) => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistSarees,
  onRemoveWishlist,
  onSelectSaree,
  onAddToCart,
  isLoggedIn = true,
  onLogin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between border-l border-[#E5DFD5] drawer-panel">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DFD5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#801319]">favorite</span>
            <h2 className="font-serif text-xl text-[#181512]">Wishlist</h2>
            <span className="font-sans text-xs text-[#756F66]">({wishlistSarees.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#756F66] hover:text-[#181512] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {!isLoggedIn && onLogin && (
          <button
            onClick={onLogin}
            className="px-6 py-3 bg-[#F5F0E8] border-b border-[#E5DFD5] text-xs text-[#181512] text-left hover:bg-[#EFE8DB] cursor-pointer"
          >
            Login to save your favourites to your account →
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {wishlistSarees.length === 0 ? (
            <div className="text-center py-16 text-[#756F66]">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">favorite_border</span>
              <p className="font-serif text-lg text-[#181512]">Your wishlist is empty</p>
            </div>
          ) : (
            wishlistSarees.map((saree) => (
              <div
                key={saree.id}
                className="flex gap-4 p-3 bg-white border border-[#E5DFD5] relative group"
              >
                <img
                  src={saree.mainImage}
                  alt={saree.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-24 object-cover bg-[#EAE5DC] cursor-pointer"
                  onClick={() => {
                    onSelectSaree(saree);
                    onClose();
                  }}
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4
                        className="font-serif text-sm text-[#181512] leading-tight font-medium hover:text-[#c89d42] cursor-pointer"
                        onClick={() => {
                          onSelectSaree(saree);
                          onClose();
                        }}
                      >
                        {saree.name}
                      </h4>
                      <button
                        onClick={() => onRemoveWishlist(saree.id)}
                        className="text-[#756F66] hover:text-[#801319] p-0.5 cursor-pointer"
                        aria-label="Remove from wishlist"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                    <span className="font-sans text-[10px] text-[#756F66] block mt-0.5">
                      {saree.sku}
                    </span>
                    <span className="font-serif text-base text-[#181512] block mt-1">
                      ₹ {saree.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        onAddToCart(saree);
                        onRemoveWishlist(saree.id);
                      }}
                      className="flex-1 py-1.5 px-2 bg-[#181512] text-white text-[10px] uppercase tracking-luxury hover:bg-[#c89d42] hover:text-[#181512] transition-colors cursor-pointer text-center"
                    >
                      Move to Bag
                    </button>
                    <button
                      onClick={() => {
                        onSelectSaree(saree);
                        onClose();
                      }}
                      className="px-2 py-1.5 border border-[#E5DFD5] text-[10px] uppercase tracking-luxury text-[#181512] hover:border-[#181512] transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
