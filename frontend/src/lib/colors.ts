import { Saree, SareeColor } from '../types';

/** Colour options of a saree. Older sarees with only a single colour name still work. */
export function getColors(s: Saree): SareeColor[] {
  if (s.colors && s.colors.length) return s.colors;
  if (s.colorName) {
    return [{ id: 'default', name: s.colorName, hex: s.colorHex || '#999999', image: '', fullImage: '' }];
  }
  return [];
}

export const colorMain = (s: Saree, c?: SareeColor) => (c && c.image) || s.mainImage;
export const colorFull = (s: Saree, c?: SareeColor) => (c && c.fullImage) || s.fullSareeLayImage;
