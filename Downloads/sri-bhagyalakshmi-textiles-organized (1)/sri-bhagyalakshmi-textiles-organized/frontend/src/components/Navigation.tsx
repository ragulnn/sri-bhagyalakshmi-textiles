import React from 'react';

interface NavigationProps {
  currentView: 'home' | 'categories' | 'account';
  onNavigate: (view: 'home' | 'categories', categoryId?: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenVideoModal: () => void;
  onOpenAccount: () => void;
  isLoggedIn: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenVideoModal,
  onOpenAccount,
  isLoggedIn
}) => {
  const link = (active: boolean) =>
    `text-[12px] uppercase tracking-luxury transition-colors cursor-pointer ${
      active ? 'text-[#181512] font-semibold' : 'text-[#756F66] hover:text-[#181512]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DFD5]/80">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 h-20 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-6 sm:w-1/3">
          <button onClick={() => onNavigate('home')} className={link(currentView === 'home')}>
            Home
          </button>
          <button onClick={() => onNavigate('categories')} className={link(currentView === 'categories')}>
            Sarees
          </button>
        </nav>

        <button onClick={() => onNavigate('home')} className="group flex items-center justify-center gap-2 sm:gap-3 text-center cursor-pointer min-w-0" aria-label="Sri Bhagyalakshmi Textiles home">
          <img src="/sbt-logo.png" alt="Sri Bhagyalakshmi Textiles SBT emblem" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-1 ring-[#c89d42]/60 shadow-sm transition-transform duration-500 group-hover:scale-105" />
          <span className="font-serif text-[10px] sm:text-base lg:text-[1.25rem] leading-tight tracking-[0.08em] sm:tracking-[0.14em] uppercase text-[#181512] group-hover:text-[#c89d42] transition-colors">
            <span className="block">Sri Bhagyalakshmi</span><span className="block text-[9px] sm:text-xs tracking-[0.28em] mt-0.5">Textiles · Ellampillai</span>
          </span>
        </button>

        <div className="flex items-center justify-end gap-3 sm:gap-5 text-[#181512] sm:w-1/3">
          <button
            onClick={onOpenVideoModal}
            aria-label="Video shopping"
            className="hidden sm:block p-1 hover:text-[#c89d42] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">videocam</span>
          </button>
          <button
            onClick={onOpenAccount}
            aria-label={isLoggedIn ? 'My account' : 'Login'}
            className={`p-1 hover:text-[#c89d42] transition-colors cursor-pointer ${currentView === 'account' ? 'text-[#c89d42]' : ''}`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isLoggedIn ? 'font-fill' : ''}`}>person</span>
          </button>
          <button onClick={onOpenSearch} aria-label="Search" className="p-1 hover:text-[#c89d42] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button onClick={onOpenWishlist} aria-label="Wishlist" className="p-1 hover:text-[#c89d42] transition-colors relative cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">favorite</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#801319] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
