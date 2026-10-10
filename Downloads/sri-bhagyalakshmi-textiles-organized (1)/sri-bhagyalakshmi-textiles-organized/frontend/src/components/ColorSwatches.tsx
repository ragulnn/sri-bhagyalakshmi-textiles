import React from 'react';
import { SareeColor } from '../types';

interface Props {
  colors: SareeColor[];
  activeId?: string;
  onSelect: (c: SareeColor) => void;
  size?: number;
}

export const ColorSwatches: React.FC<Props> = ({ colors, activeId, onSelect, size = 22 }) => {
  if (!colors.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.name}
          aria-label={c.name}
          onClick={() => onSelect(c)}
          style={{ backgroundColor: c.hex, width: size, height: size }}
          className={`rounded-full border cursor-pointer ${
            activeId === c.id ? 'ring-2 ring-offset-2 ring-[#181512] border-white' : 'border-[#E5DFD5]'
          }`}
        />
      ))}
    </div>
  );
};
