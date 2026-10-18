import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AdminPortal } from './AdminPortal';

const { mockUseStore, mockSave, mockReload } = vi.hoisted(() => ({
  mockUseStore: vi.fn(),
  mockSave: vi.fn(),
  mockReload: vi.fn(),
}));

vi.mock('../store/StoreContext', () => ({
  useStore: mockUseStore,
}));

vi.mock('./AdminOrders', () => ({
  AdminOrders: () => <div data-testid="admin-orders">Orders panel</div>,
}));

vi.mock('./AdminSecurity', () => ({
  AdminSecurity: () => <div data-testid="admin-security">Security panel</div>,
}));

const category = {
  id: 'silk-sarees',
  name: 'Silk Sarees',
  shortName: 'Silk',
  count: 0,
  startingPrice: 1000,
  heroImage: '',
  description: '',
  features: [],
};

const saree = {
  id: 'saree-1',
  sku: 'SB001',
  name: 'Kanjivaram Silk Saree',
  categoryId: 'silk-sarees',
  category: 'Silk Sarees',
  price: 9000,
  originalPrice: 9000,
  stockQuantity: 4,
  inStock: true,
  mainImage: '/saree.jpg',
  fullImage: '',
  colors: [],
  colorName: 'Red',
  colorHex: '#ff0000',
  gallery: ['/saree.jpg'],
};

const customer = {
  id: 'customer-1',
  name: 'Test Customer',
  phone: '9876543210',
  email: 'customer@example.com',
  address: 'Salem',
  createdAt: '2026-01-10T00:00:00.000Z',
  favourites: ['saree-1'],
};

const jsonResponse = (data: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  }) as unknown as Response;

describe('AdminPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    mockSave.mockResolvedValue(undefined);
    mockReload.mockResolvedValue(undefined);

    mockUseStore.mockReturnValue({
      categories: [category],
      sarees: [saree],
      save: mockSave,
      reload: mockReload,
      offline: false,
      loading: false,
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (url === '/api/admin/orders') {
          return jsonResponse({ orders: [] });
        }

        if (url === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: true });
        }

        if (url === '/api/admin/customers') {
          return jsonResponse({ customers: [customer] });
        }

        return jsonResponse({});
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the login form when no token exists', () => {
    render(<AdminPortal />);

    expect(
      screen.getByRole('heading', { name: /admin portal/i }),
    ).toBeTruthy();

    expect(
      screen.getByRole('button', { name: /sign in securely/i }),
    ).toBeTruthy();
  });

  it('shows the dashboard when a token exists', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    expect(await screen.findByTestId('admin-orders')).toBeTruthy();
    expect(screen.getByRole('button', { name: /log out/i })).toBeTruthy();
  });

  it('opens the categories tab', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /categories/i }));

    expect(await screen.findByText('Silk Sarees')).toBeTruthy();

    expect(
      screen.getByRole('button', { name: /\+ new category/i }),
    ).toBeTruthy();
  });

  it('opens the sarees tab', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));

    expect(await screen.findByText('Kanjivaram Silk Saree')).toBeTruthy();
    expect(screen.getByText('SB001')).toBeTruthy();
  });

  it('loads customers when the customers tab is opened', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /customers/i }));

    expect(await screen.findByText('Test Customer')).toBeTruthy();
    expect(screen.getByText(/customer@example\.com/)).toBeTruthy();
    expect(screen.getByText('Salem')).toBeTruthy();
    expect(screen.getByText('SB001')).toBeTruthy();
  });

  it('opens the security tab', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /^security$/i }),
    );

    expect(await screen.findByTestId('admin-security')).toBeTruthy();
  });

  it('logs out and clears the stored token', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(
      await screen.findByRole('heading', { name: /admin portal/i }),
    ).toBeTruthy();

    expect(sessionStorage.getItem('sbt_admin_token')).toBeNull();
  });

  it('prevents deleting a category that still has sarees', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /categories/i }));

    fireEvent.click(
      await screen.findByRole('button', { name: /^delete$/i }),
    );

    expect(
      await screen.findByText(/still has 1 saree/i),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('validates an empty category name', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /categories/i }));

    fireEvent.click(
      await screen.findByRole('button', { name: /\+ new category/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /save category/i }),
    );

    expect(
      await screen.findByText('Category name is required.'),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('rejects a duplicate category name', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /categories/i }));

    fireEvent.click(
      await screen.findByRole('button', { name: /\+ new category/i }),
    );

    const nameInput = screen.getByText('Category name *')
      .parentElement?.querySelector('input');

    expect(nameInput).toBeTruthy();

    fireEvent.change(nameInput!, {
      target: { value: '  silk sarees  ' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /save category/i }),
    );

    expect(
      await screen.findByText(
        'A category with this name already exists.',
      ),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('validates the saree code when creating a saree', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));

    fireEvent.click(
      await screen.findByRole('button', { name: /\+ new saree/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /save saree/i }),
    );

    expect(
      await screen.findByText('Saree code is required.'),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('allows cancelling category creation', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /categories/i }));

    fireEvent.click(
      await screen.findByRole('button', { name: /\+ new category/i }),
    );

    expect(
      screen.getByRole('heading', { name: /new category/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(
      await screen.findByRole('button', { name: /\+ new category/i }),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('allows cancelling saree creation', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));

    fireEvent.click(
      await screen.findByRole('button', { name: /\+ new saree/i }),
    );

    expect(
      screen.getByRole('heading', { name: /new saree/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(
      await screen.findByRole('button', { name: /\+ new saree/i }),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });
});
