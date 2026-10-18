import React, { useState, useEffect } from 'react';
import { Saree, CartItem, SareeColor } from './types';
import { useStore } from './store/StoreContext';
import { AdminPortal } from './components/AdminPortal';
import { SareeCanvasHero } from './components/SareeCanvasHero';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { CategoriesView } from './components/CategoriesView';
import { SareeDetailModal } from './components/SareeDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { VideoShoppingModal } from './components/VideoShoppingModal';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { AccountView } from './components/AccountView';
import { useAuth } from './store/AuthContext';
import { getWhatsAppGeneralUrl } from './data/sareesData';

export default function App() {
  const { sarees } = useStore();
  const { user, setFavourites } = useAuth();
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.hash.startsWith('#/admin'));
  useEffect(() => {
    const onHash = () => setIsAdminRoute(window.location.hash.startsWith('#/admin'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [currentView, setCurrentView] = useState<'home' | 'categories' | 'account'>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedSaree, setSelectedSaree] = useState<Saree | null>(null);

  // Cart state with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sbt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state with localStorage persistence
  const [guestWishlist, setGuestWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sbt_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal & Drawer toggles
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('sbt_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('sbt_wishlist', JSON.stringify(guestWishlist));
    } catch {}
  }, [guestWishlist]);

  // Logged in: favourites live in the account. Logged out: kept in this browser.
  const wishlistIds = user ? user.favourites : guestWishlist;

  // On login, move anything saved as a guest into the account
  useEffect(() => {
    if (!user || guestWishlist.length === 0) return;
    const merged = Array.from(new Set([...user.favourites, ...guestWishlist]));
    if (merged.length !== user.favourites.length) setFavourites(merged);
    setGuestWishlist([]);
  }, [user?.id]);

  // Wishlisted sarees list
  const wishlistSarees = sarees.filter((s) => wishlistIds.includes(s.id));

  // Cart actions
  const handleAddToCart = (base: Saree, color?: SareeColor) => {
    // A saree in a chosen colour is its own bag line
    const saree: Saree = color
      ? {
          ...base,
          id: `${base.id}::${color.id}`,
          name: `${base.name} · ${color.name}`,
          mainImage: color.image || base.mainImage
        }
      : base;
    return; // Online ordering is disabled until a future deployment.
    setCart((prev) => {
      const existing = prev.find((item) => item.saree.id === saree.id);
      if (existing) {
        return prev.map((item) =>
          item.saree.id === saree.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { saree, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (sareeId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.saree.id === sareeId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (sareeId: string) => {
    setCart((prev) => prev.filter((item) => item.saree.id !== sareeId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Wishlist actions
  const handleToggleWishlist = (sareeId: string) => {
    const next = wishlistIds.includes(sareeId)
      ? wishlistIds.filter((id) => id !== sareeId)
      : [...wishlistIds, sareeId];
    if (user) setFavourites(next);
    else setGuestWishlist(next);
  };

  // Navigation handlers
  const handleNavigate = (view: 'home' | 'categories', categoryId?: string) => {
    setCurrentView(view);
    setSelectedCategoryId(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAccount = () => {
    setCurrentView('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryId?: string) => {
    setCurrentView('categories');
    setSelectedCategoryId(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToExplore = () => {
    const el = document.getElementById('store-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight * 0.95, behavior: 'smooth' });
    }
  };

  if (isAdminRoute) return <AdminPortal />;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#181512] font-sans flex flex-col selection:bg-[#c89d42]/20 selection:text-[#181512]">
      {/* 1. 3D MOVING SILK SAREES HERO (Shown on home view) */}
      {currentView === 'home' && (
        <SareeCanvasHero
          onExploreClick={handleScrollToExplore}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {/* 2. STICKY TOP NAVIGATION & UTILITY BAR */}
      <div id="store-content">
        <Navigation
          currentView={currentView}
          onNavigate={handleNavigate}
          cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
          wishlistCount={wishlistIds.length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenVideoModal={() => setIsVideoModalOpen(true)}
          onOpenAccount={openAccount}
          isLoggedIn={!!user}
        />
      </div>

      <div role="status" className="bg-[#fdf6e3] border-b border-[#c89d42]/40 px-6 py-3 text-center text-sm text-[#5d4818]">
        Online ordering is temporarily unavailable. Browse our saree collection now; ordering will be enabled in a future update.
      </div>

      {/* 3. MAIN CONTENT: HOME VIEW OR CATEGORIES & SAREE LIST VIEW */}
      <main key={`${currentView}-${selectedCategoryId ?? 'all'}`} className="flex-1 view-transition">
        {currentView === 'account' ? (
          <AccountView
            onContinue={() => handleNavigate('home')}
            onSelectSaree={(saree) => setSelectedSaree(saree)}
          />
        ) : currentView === 'home' ? (
          <HomeView
            onSelectCategory={handleSelectCategory}
            onSelectSaree={(saree) => setSelectedSaree(saree)}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onOpenVideoModal={() => setIsVideoModalOpen(true)}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <CategoriesView
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
            onSelectSaree={(saree) => setSelectedSaree(saree)}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      {/* 4. EDITORIAL HAUTE COUTURE FOOTER */}
      <Footer onSelectCategory={handleSelectCategory} />

      {/* 5. DEDICATED SAREE DETAIL MODAL (List of pics + Rectangular 6.2m Full Lay) */}
      <SareeDetailModal
        saree={selectedSaree}
        onClose={() => setSelectedSaree(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={selectedSaree ? wishlistIds.includes(selectedSaree.id) : false}
        onOpenVideoModal={() => {
          setSelectedSaree(null);
          setIsVideoModalOpen(true);
        }}
      />
      {/* 6. CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />
      {/* 7. WISHLIST DRAWER */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistSarees={wishlistSarees}
        onRemoveWishlist={handleToggleWishlist}
        onSelectSaree={(saree) => setSelectedSaree(saree)}
        onAddToCart={handleAddToCart}
        isLoggedIn={!!user}
        onLogin={() => {
          setIsWishlistOpen(false);
          openAccount();
        }}
      />

      {/* 8. VIDEO DRAPE CONSULTATION MODAL */}
      <VideoShoppingModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      <a
        href={getWhatsAppGeneralUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Sri Bhagyalakshmi Textiles on WhatsApp"
        title="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#c89d42] text-[#181512] shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#c89d42]/40"
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.15 1.59 5.96L.05 24l6.27-1.64a11.9 11.9 0 0 0 5.76 1.47h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.5-8.42ZM12.09 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.63-.24-.37a9.85 9.85 0 0 1-1.52-5.26c0-5.46 4.44-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.87-9.91 9.87Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
        </svg>
      </a>

      {/* 9. SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSaree={(saree) => setSelectedSaree(saree)}
      />
    </div>
  );
}
