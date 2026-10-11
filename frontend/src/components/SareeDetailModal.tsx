import React, { useEffect, useState } from 'react';
import { Saree, SareeColor } from '../types';
import { getColors, colorMain, colorFull } from '../lib/colors';
import { getWhatsAppOrderUrl } from '../data/sareesData';
import { ColorSwatches } from './ColorSwatches';

interface SareeDetailModalProps {
  saree: Saree | null;
  onClose: () => void;
  onAddToCart: (saree: Saree, color?: SareeColor) => void;
  onToggleWishlist: (sareeId: string) => void;
  isWishlisted: boolean;
  onOpenVideoModal: () => void;
}

export const SareeDetailModal: React.FC<SareeDetailModalProps> = ({
  saree,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [colorId, setColorId] = useState<string | undefined>(undefined);
  const [fullscreen, setFullscreen] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset when a different saree is opened
  useEffect(() => {
    setActiveIndex(0);
    setColorId(saree ? getColors(saree)[0]?.id : undefined);
    setFullscreen(false);
  }, [saree?.id]);

  if (!saree) return null;

  const colors = getColors(saree);
  const color = colors.find((c) => c.id === colorId) || colors[0];

  // First photo follows the chosen colour; the rest are the saree's extra photos
  const photos = [
    { id: 'main', url: colorMain(saree, color), title: saree.name },
    ...saree.galleryImages
      .filter((g) => g.url !== saree.mainImage)
      .map((g) => ({ id: g.id, url: g.url, title: g.title }))
  ];
  const active = photos[activeIndex] || photos[0];
  const full = colorFull(saree, color);

  const handleAdd = () => {
    onAddToCart(saree, colors.length ? color : undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-start p-2 sm:p-4">
      <div className="relative bg-[#FAF7F2] w-full max-w-[1200px] my-4 border border-[#E5DFD5] modal-panel">
        <div className="sticky top-0 z-20 bg-[#FAF7F2]/95 px-6 py-4 border-b border-[#E5DFD5] flex items-center justify-between">
          <span className="text-[12px] uppercase tracking-widest text-[#c89d42] font-semibold">{saree.sku}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => onToggleWishlist(saree.id)} aria-label="Wishlist" className="cursor-pointer">
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isWishlisted ? 'text-[#801319] font-fill' : 'text-[#181512]'
                }`}
              >
                favorite
              </span>
            </button>
            <button onClick={onClose} aria-label="Close" className="cursor-pointer">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
              <div className="flex md:flex-col gap-3 overflow-x-auto md:w-24 shrink-0">
                {photos.map((img, idx) => (
                  <button
                    key={img.id + idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-20 h-24 md:w-full md:h-28 border overflow-hidden shrink-0 cursor-pointer ${
                      activeIndex === idx ? 'border-[#c89d42] ring-1 ring-[#c89d42]' : 'border-[#E5DFD5] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex-1 aspect-[4/5] max-h-[640px] bg-[#EAE5DC] border border-[#E5DFD5] overflow-hidden">
                <img src={active.url} alt={active.title} referrerPolicy="no-referrer" className="w-full h-full object-cover object-top" />
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-5">
              <div>
                <p className="text-[12px] uppercase tracking-widest text-[#c89d42] font-semibold">{saree.sku}</p>
                <h1 className="font-serif text-3xl text-[#181512] mt-1 leading-tight">{saree.name}</h1>
              </div>
              <p className="font-serif text-3xl text-[#181512]">₹ {saree.price.toLocaleString('en-IN')}</p>

              {colors.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[#756F66] mb-2">
                    Colour: <span className="text-[#181512]">{color?.name}</span>
                  </p>
                  <ColorSwatches
                    colors={colors}
                    activeId={color?.id}
                    onSelect={(c) => {
                      setColorId(c.id);
                      setActiveIndex(0);
                    }}
                    size={30}
                  />
                </div>
              )}

              <div className="space-y-3 pt-2">
                <a
                  href={getWhatsAppOrderUrl(saree, color?.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 flex items-center justify-center gap-2 text-center bg-[#187A43] text-white text-[11px] uppercase tracking-luxury hover:bg-[#126536] transition-colors"
                  aria-label={`Enquire about ${saree.name} on WhatsApp`}
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Enquire on WhatsApp
                </a>
                <p className="text-center text-xs text-[#756F66]">
                  Online checkout is coming soon. Contact us on WhatsApp to check availability.
                </p>
              </div>
            </div>
          </div>

          {full && (
            <div className="relative w-full aspect-[16/9] bg-[#EAE5DC] border border-[#E5DFD5] overflow-hidden">
              <img src={full} alt={`Full saree ${saree.sku}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              <button
                onClick={() => setFullscreen(true)}
                className="absolute top-4 left-4 bg-black/50 text-white text-[10px] uppercase tracking-luxury px-3 py-1.5 hover:bg-black/80 cursor-pointer"
              >
                Expand
              </button>
            </div>
          )}
        </div>
      </div>

      {fullscreen && full && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setFullscreen(false)}
            className="mb-4 px-4 py-2 border border-white/40 text-white text-xs uppercase tracking-widest hover:bg-white hover:text-black cursor-pointer"
          >
            Close
          </button>
          <img src={full} alt={saree.sku} referrerPolicy="no-referrer" className="max-w-full max-h-[85vh] object-contain" />
        </div>
      )}
    </div>
  );
};
