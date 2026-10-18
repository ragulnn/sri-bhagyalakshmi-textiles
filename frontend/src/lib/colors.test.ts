
import { describe, it, expect } from 'vitest';
import { getColors, colorMain, colorFull } from './colors';
import type { Saree, SareeColor } from '../types';

const baseSaree = {
  mainImage: '/images/main.jpg',
  fullSareeLayImage: '/images/full.jpg',
} as Saree;

describe('getColors', () => {
  it('returns the available colors when a saree has multiple colors', () => {
    const colors = [
      {
        id: 'red',
        name: 'Red',
        hex: '#ff0000',
        image: '/images/red.jpg',
        fullImage: '/images/red-full.jpg',
      },
      {
        id: 'blue',
        name: 'Blue',
        hex: '#0000ff',
        image: '/images/blue.jpg',
        fullImage: '/images/blue-full.jpg',
      },
    ] satisfies SareeColor[];

    expect(getColors({ ...baseSaree, colors })).toEqual(colors);
  });

  it('creates a default color for an older saree with colorName', () => {
    const saree = {
      ...baseSaree,
      colorName: 'Green',
      colorHex: '#008000',
    } as Saree;

    expect(getColors(saree)).toEqual([
      {
        id: 'default',
        name: 'Green',
        hex: '#008000',
        image: '',
        fullImage: '',
      },
    ]);
  });

  it('uses the default hex color when colorHex is missing', () => {
    const saree = {
      ...baseSaree,
      colorName: 'Green',
    } as Saree;

    expect(getColors(saree)[0].hex).toBe('#999999');
  });

  it('returns an empty array when no colors are available', () => {
    expect(getColors(baseSaree)).toEqual([]);
  });

  it('returns an empty array when colors is empty and colorName is missing', () => {
    expect(getColors({ ...baseSaree, colors: [] } as Saree)).toEqual([]);
  });
});

describe('colorMain', () => {
  it('returns the selected color image when available', () => {
    const color = { image: '/images/red.jpg' } as SareeColor;

    expect(colorMain(baseSaree, color)).toBe('/images/red.jpg');
  });

  it('falls back to the saree main image when the selected image is missing', () => {
    expect(colorMain(baseSaree, undefined)).toBe('/images/main.jpg');
    expect(colorMain(baseSaree, { image: '' } as SareeColor))
      .toBe('/images/main.jpg');
  });
});

describe('colorFull', () => {
  it('returns the selected full image when available', () => {
    const color = { fullImage: '/images/red-full.jpg' } as SareeColor;

    expect(colorFull(baseSaree, color)).toBe('/images/red-full.jpg');
  });

  it('falls back to the saree full image when the selected full image is missing', () => {
    expect(colorFull(baseSaree, undefined)).toBe('/images/full.jpg');
    expect(colorFull(baseSaree, { fullImage: '' } as SareeColor))
      .toBe('/images/full.jpg');
  });
});
