import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { StoreProvider, useStore } from './StoreContext';
import type { StoreData } from './StoreContext';

const sampleData: StoreData = {
  categories: [
    {
      id: 'test-category',
      name: 'Test Silks',
      shortName: 'Test',
      count: 1,
      startingPrice: 1000,
      provenance: 'Tamil Nadu',
      description: 'Test category',
      heroImage: '/test.jpg',
      features: ['Handwoven'],
    },
  ],
  sarees: [],
};

function StoreConsumer() {
  const store = useStore();

  return (
    <div>
      <span data-testid="loading">{String(store.loading)}</span>
      <span data-testid="offline">{String(store.offline)}</span>
      <span data-testid="category-count">{store.categories.length}</span>
      <span data-testid="category-name">{store.categories[0]?.name ?? 'none'}</span>
      <button onClick={() => store.reload()}>Reload</button>
      <button onClick={() => store.save(sampleData, 'test-token')}>Save</button>
    </div>
  );
}

function renderStore() {
  return render(
    <StoreProvider>
      <StoreConsumer />
    </StoreProvider>,
  );
}

describe('StoreContext', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads store data from the API', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => sampleData,
    } as Response);

    renderStore();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('offline').textContent).toBe('false');
    expect(screen.getByTestId('category-name').textContent).toBe('Test Silks');
    expect(fetch).toHaveBeenCalledWith('/api/store', {
      cache: 'no-store',
    });
  });

  it('falls back to built-in data when the API request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network unavailable'));

    renderStore();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('offline').textContent).toBe('true');
    expect(Number(screen.getByTestId('category-count').textContent)).toBeGreaterThan(0);
  });

  it('falls back when the API returns a non-success status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    renderStore();

    await waitFor(() => {
      expect(screen.getByTestId('offline').textContent).toBe('true');
    });
  });

  it('saves store data with the authorization token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => sampleData,
    } as Response);

    renderStore();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    vi.mocked(fetch).mockClear();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await act(async () => {
      screen.getByRole('button', { name: 'Save' }).click();
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/store', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(sampleData),
    });
  });


  it('rejects useStore when rendered outside the provider', () => {
    function InvalidConsumer() {
      useStore();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useStore must be used inside StoreProvider',
    );
  });
});
