import React from 'react';
import { Saree } from '../types';
import { useStore } from '../store/StoreContext';

interface HomeViewProps {
  onSelectCategory: (categoryId?: string) => void;
  onSelectSaree: (saree: Saree) => void;
  onToggleWishlist: (sareeId: string) => void;
  wishlistIds: string[];
  onOpenVideoModal: () => void;
  onAddToCart: (saree: Saree) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectCategory, onSelectSaree }) => {
  const { sarees: SAREES_DATA, categories: CATEGORIES } = useStore();
  const countFor = (categoryId: string) =>
    SAREES_DATA.filter((s) => s.categoryId === categoryId).length;
  // Newest pieces = last added to the data file, shown first
  const justIn = [...SAREES_DATA].reverse().slice(0, 4);

  return (
    <div className="w-full">
      {/* SLIDE 2: JUST IN + EVERY COLLECTION */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 py-20 lg:py-28">
        {/* Just In */}
        <div className="flex items-end justify-between mb-10 pb-5 border-b border-[#E5DFD5]">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#181512] font-normal">Just In</h2>
          <button
            onClick={() => onSelectCategory(undefined)}
            className="font-sans text-[11px] uppercase tracking-luxury text-[#181512] border-b border-[#181512] pb-0.5 hover:text-[#c89d42] hover:border-[#c89d42] transition-colors cursor-pointer"
          >
            View All ({SAREES_DATA.length}) →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {justIn.map((saree) => (
            <article
              key={saree.id}
              onClick={() => onSelectSaree(saree)}
              className="group cursor-pointer"
            >
              <div className="relative w-full aspect-[3/4] bg-[#EAE5DC] overflow-hidden">
                <img
                  src={saree.mainImage}
                  alt={saree.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-[#c89d42] text-[#181512] text-[9px] uppercase tracking-widest px-2 py-1 font-medium">
                  New
                </span>
              </div>
              <div className="mt-3">
                <p className="font-sans text-[11px] uppercase tracking-widest text-[#c89d42] font-medium">
                  {saree.sku}
                </p>
                <p className="font-serif text-lg text-[#181512] leading-snug mt-0.5">{saree.name}</p>
                <p className="font-serif text-base text-[#181512] mt-1">
                  ₹ {saree.price.toLocaleString('en-IN')}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Every Collection */}
        <div className="flex items-end justify-between mt-24 mb-10 pb-5 border-b border-[#E5DFD5]">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#181512] font-normal">Collections</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group text-left cursor-pointer"
            >
              <div className="w-full aspect-[4/5] bg-[#EAE5DC] overflow-hidden">
                <img
                  src={cat.heroImage}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="font-serif text-lg text-[#181512] mt-3 leading-snug group-hover:text-[#c89d42] transition-colors">
                {cat.shortName}
              </p>
              <p className="font-sans text-[11px] uppercase tracking-widest text-[#756F66] mt-0.5">
                {countFor(cat.id)} {countFor(cat.id) === 1 ? 'saree' : 'sarees'}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* SLIDE 3: ALL CATEGORIES (NAMES) */}
      <section className="bg-[#F5F0E8] border-y border-[#E5DFD5] py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#181512] font-normal mb-10 pb-5 border-b border-[#E5DFD5]">
            All Categories
          </h2>

          <ul>
            {CATEGORIES.map((cat, idx) => (
              <li key={cat.id}>
                <button
                  onClick={() => onSelectCategory(cat.id)}
                  className="group w-full flex items-center justify-between gap-4 py-6 border-b border-[#E5DFD5] cursor-pointer text-left"
                >
                  <span className="flex items-baseline gap-5">
                    <span className="font-sans text-[11px] text-[#756F66] w-6">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif text-2xl sm:text-3xl text-[#181512] group-hover:text-[#c89d42] transition-colors">
                      {cat.name}
                    </span>
                  </span>
                  <span className="font-sans text-[11px] uppercase tracking-luxury text-[#756F66] whitespace-nowrap group-hover:text-[#181512]">
                    {countFor(cat.id)} →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};
