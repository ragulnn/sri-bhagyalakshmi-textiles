import React, { useState } from 'react';
import { Saree, SareeColor } from '../types';
import { useStore } from '../store/StoreContext';
import { getColors, colorMain, colorFull } from '../lib/colors';
import { getWhatsAppOrderUrl } from '../data/sareesData';
import { ColorSwatches } from './ColorSwatches';

interface CategoriesViewProps {
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string | undefined) => void;
  onSelectSaree: (saree: Saree) => void;
  onToggleWishlist: (sareeId: string) => void;
  wishlistIds: string[];
  onAddToCart: (saree: Saree, color?: SareeColor) => void;
}

const SareeCard: React.FC<{
  saree: Saree;
  isWishlisted: boolean;
  onSelectSaree: (s: Saree) => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (s: Saree, c?: SareeColor) => void;
}> = ({ saree, isWishlisted, onSelectSaree, onToggleWishlist, onAddToCart }) => {
  const colors = getColors(saree);
  const [colorId, setColorId] = useState(colors[0]?.id);
  const color = colors.find((c) => c.id === colorId) || colors[0];
  const full = colorFull(saree, color);

  return (
    <article className="bg-white border border-[#E5DFD5] flex flex-col">
      {/* Code */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5DFD5]">
        <span className="font-sans text-[12px] uppercase tracking-widest text-[#c89d42] font-semibold">
          {saree.sku}
        </span>
        <button
          type="button"
          onClick={() => onToggleWishlist(saree.id)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              isWishlisted ? 'text-[#801319] font-fill' : 'text-[#756F66]'
            }`}
          >
            favorite
          </span>
        </button>
      </div>

      {/* Saree picture */}
      <div
        onClick={() => onSelectSaree(saree)}
        className="w-full aspect-[3/4] bg-[#EAE5DC] overflow-hidden cursor-pointer"
      >
        <img
          src={colorMain(saree, color)}
          alt={saree.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top"
        />
      </div>

      {/* Rectangular full saree picture */}
      {full && (
        <div
          onClick={() => onSelectSaree(saree)}
          className="w-full aspect-[16/9] bg-[#EAE5DC] overflow-hidden cursor-pointer border-t border-[#E5DFD5]"
        >
          <img
            src={full}
            alt={`Full saree ${saree.sku}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-lg text-[#181512] leading-snug">{saree.name}</h3>
          <span className="font-serif text-lg text-[#181512] whitespace-nowrap">
            ₹ {saree.price.toLocaleString('en-IN')}
          </span>
        </div>

        {colors.length > 0 && (
          <div className="flex items-center gap-3">
            <ColorSwatches colors={colors} activeId={color?.id} onSelect={(c) => setColorId(c.id)} />
            <span className="text-[11px] uppercase tracking-widest text-[#756F66]">{color?.name}</span>
          </div>
        )}

        <a
          href={getWhatsAppOrderUrl(saree, color?.name)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="py-3 flex items-center justify-center gap-2 bg-[#187A43] text-white text-[10px] uppercase tracking-luxury hover:bg-[#126536] transition-colors"
          aria-label={`Enquire about ${saree.name} on WhatsApp`}
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          Enquire on WhatsApp
        </a>
        <p className="text-center text-[10px] text-[#756F66]">Online checkout coming soon</p>
      </div>
    </article>
  );
};

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  selectedCategoryId,
  onSelectCategory,
  onSelectSaree,
  onToggleWishlist,
  wishlistIds,
  onAddToCart
}) => {
  const { categories: CATEGORIES, sarees: SAREES_DATA } = useStore();
  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategoryId);
  const sarees = SAREES_DATA.filter((s) => !selectedCategoryId || s.categoryId === selectedCategoryId);

  const chip = (active: boolean) =>
    `px-4 py-2 text-[11px] uppercase tracking-luxury border transition-colors cursor-pointer ${
      active
        ? 'bg-[#181512] text-white border-[#181512]'
        : 'bg-white text-[#756F66] border-[#E5DFD5] hover:text-[#181512] hover:border-[#181512]'
    }`;

  return (
    <div className="w-full bg-[#FAF7F2] py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16">
        <div className="mb-8 pb-6 border-b border-[#E5DFD5]">
          <p className="text-[11px] uppercase tracking-luxury text-[#756F66] mb-2">
            <button onClick={() => onSelectCategory(undefined)} className="hover:text-[#181512] cursor-pointer">
              All Sarees
            </button>
            {activeCategory && (
              <span>
                {' '}
                / <span className="text-[#181512]">{activeCategory.name}</span>
              </span>
            )}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#181512] font-normal">
            {activeCategory ? activeCategory.name : 'All Sarees'}
          </h1>
          <p className="font-sans text-[12px] uppercase tracking-widest text-[#756F66] mt-3">
            {sarees.length} {sarees.length === 1 ? 'saree' : 'sarees'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <button onClick={() => onSelectCategory(undefined)} className={chip(!selectedCategoryId)}>
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={chip(selectedCategoryId === cat.id)}
            >
              {cat.shortName}
            </button>
          ))}
        </div>

        {sarees.length === 0 ? (
          <div className="bg-white border border-[#E5DFD5] p-16 text-center font-serif text-2xl text-[#181512]">
            No sarees in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sarees.map((saree) => (
              <SareeCard
                key={saree.id}
                saree={saree}
                isWishlisted={wishlistIds.includes(saree.id)}
                onSelectSaree={onSelectSaree}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
