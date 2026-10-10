import React, { useState, useMemo } from 'react';
import { Saree } from '../types';
import { useStore } from '../store/StoreContext';
import { getColors } from '../lib/colors';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSaree: (saree: Saree) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectSaree }) => {
  const { sarees } = useStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return sarees.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        getColors(s).some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query, sarees]);

  if (!isOpen) return null;

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-24" onClick={close}>
      <div className="w-full max-w-2xl bg-[#FAF7F2] modal-panel border border-[#E5DFD5] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#E5DFD5] pb-3">
          <span className="material-symbols-outlined text-[24px] text-[#756F66]">search</span>
          <input
            type="text"
            autoFocus
            placeholder="Search by name, code or colour"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base text-[#181512] placeholder-[#756F66] focus:outline-none font-serif"
          />
          <button onClick={close} aria-label="Close" className="p-1 text-[#756F66] hover:text-[#181512] cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-3 max-h-[60vh] overflow-y-auto divide-y divide-[#E5DFD5]">
          {query.trim() && results.length === 0 && (
            <p className="py-8 text-center text-sm text-[#756F66]">No sarees found.</p>
          )}
          {results.map((saree) => (
            <button
              key={saree.id}
              onClick={() => {
                onSelectSaree(saree);
                close();
              }}
              className="w-full flex items-center gap-4 py-3 text-left cursor-pointer hover:bg-white"
            >
              <img src={saree.mainImage} alt="" referrerPolicy="no-referrer" className="w-14 h-16 object-cover bg-[#EAE5DC]" />
              <div className="flex-1">
                <span className="font-sans text-[10px] uppercase tracking-widest text-[#c89d42] font-semibold">{saree.sku}</span>
                <h4 className="font-serif text-base text-[#181512]">{saree.name}</h4>
              </div>
              <span className="font-serif text-base text-[#181512]">₹ {saree.price.toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
