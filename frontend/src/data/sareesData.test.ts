
import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  SAREES_DATA,
  getWhatsAppOrderUrl,
  getWhatsAppGeneralUrl,
} from './sareesData';

describe('CATEGORIES catalogue', () => {
  it('contains at least one category', () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
  });

  it('has unique category IDs', () => {
    const ids = CATEGORIES.map((category) => category.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides the required fields for every category', () => {
    for (const category of CATEGORIES) {
      expect(category.id.trim()).not.toBe('');
      expect(category.name.trim()).not.toBe('');
      expect(category.shortName.trim()).not.toBe('');
      expect(category.description.trim()).not.toBe('');
      expect(category.provenance.trim()).not.toBe('');
      expect(category.heroImage.trim()).not.toBe('');
      expect(Array.isArray(category.features)).toBe(true);
      expect(category.features.length).toBeGreaterThan(0);
    }
  });

  it('uses valid non-negative prices and counts', () => {
    for (const category of CATEGORIES) {
      expect(Number.isFinite(category.count)).toBe(true);
      expect(category.count).toBeGreaterThanOrEqual(0);

      expect(Number.isFinite(category.startingPrice)).toBe(true);
      expect(category.startingPrice).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getWhatsAppOrderUrl', () => {
  it('returns a WhatsApp URL with the business number', () => {
    const url = getWhatsAppOrderUrl(SAREES_DATA[0]);

    expect(url).toMatch(/^https:\/\/wa\.me\/917358616601\?text=/);
  });

  it('includes the saree name, SKU, price, and origin', () => {
    const saree = SAREES_DATA[0];
    const url = getWhatsAppOrderUrl(saree);
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).toContain(`Drape: ${saree.name}`);
    expect(message).toContain(`SKU: ${saree.sku}`);
    expect(message).toContain(
      `₹${saree.price.toLocaleString('en-IN')}`,
    );
    expect(message).toContain(`Origin: ${saree.weaverOrigin}`);
  });

  it('includes the selected colour when provided', () => {
    const url = getWhatsAppOrderUrl(SAREES_DATA[0], 'Royal Blue');
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).toContain('Colour: Royal Blue');
  });

  it('omits the colour line when no colour is provided', () => {
    const url = getWhatsAppOrderUrl(SAREES_DATA[0]);
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).not.toContain('Colour:');
  });

  it('encodes special characters in the message', () => {
    const url = getWhatsAppOrderUrl(SAREES_DATA[0], 'Red & Gold');
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).toContain('Colour: Red & Gold');
    expect(url).not.toContain('Red & Gold');
  });
});

describe('getWhatsAppGeneralUrl', () => {
  it('returns the configured WhatsApp business URL', () => {
    const url = getWhatsAppGeneralUrl();

    expect(url).toMatch(/^https:\/\/wa\.me\/917358616601\?text=/);
  });

  it('includes the general assistance message', () => {
    const url = getWhatsAppGeneralUrl();
    const message = decodeURIComponent(url.split('?text=')[1]);

    expect(message).toContain('Vanakkam!');
    expect(message).toContain('Sri Bhagyalakshmi Textiles');
    expect(message).toContain('handloom sarees');
  });
});
