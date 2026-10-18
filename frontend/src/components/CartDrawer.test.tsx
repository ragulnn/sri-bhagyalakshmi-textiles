
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CartDrawer } from './CartDrawer';
import type { CartItem, Saree } from '../types';

const { mockGetToken, mockReload } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockReload: vi.fn(),
}));

vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    getToken: mockGetToken,
  }),
}));

vi.mock('../store/StoreContext', () => ({
  useStore: () => ({
    reload: mockReload,
  }),
}));

const mockSaree: Saree = {
  id: 'saree-1',
  name: 'Kanchipuram Silk Saree',
  sku: 'SBT-001',
  price: 2000,
  mainImage: '/images/kanchipuram-silk.jpg',
} as Saree;

const mockCartItem: CartItem = {
  saree: mockSaree,
  quantity: 2,
} as CartItem;

const createProps = (
  overrides: Partial<React.ComponentProps<typeof CartDrawer>> = {},
) => ({
  isOpen: true,
  onClose: vi.fn(),
  items: [mockCartItem],
  onUpdateQuantity: vi.fn(),
  onRemoveItem: vi.fn(),
  onClearCart: vi.fn(),
  ...overrides,
});

const mockFetchResponse = (
  body: unknown,
  options: { ok?: boolean; status?: number } = {},
) =>
  ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

describe('CartDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(undefined);
    mockReload.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('does not render when closed', () => {
    render(<CartDrawer {...createProps({ isOpen: false })} />);

    expect(
      screen.queryByRole('heading', { name: 'Bag' }),
    ).not.toBeInTheDocument();
  });

  it('renders the bag heading and item count', () => {
    render(<CartDrawer {...createProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Bag' }),
    ).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('renders item details and quantity', () => {
    render(<CartDrawer {...createProps()} />);

    expect(
      screen.getByText('Kanchipuram Silk Saree'),
    ).toBeInTheDocument();
    expect(screen.getByText('SBT-001')).toBeInTheDocument();

    expect(
      screen.getByRole('img', { name: 'Kanchipuram Silk Saree' }),
    ).toHaveAttribute('src', '/images/kanchipuram-silk.jpg');

    expect(screen.getByText('2')).toBeInTheDocument();

    // Item price, subtotal, and total all display ₹4,000.
    expect(screen.getAllByText(/4,000/)).toHaveLength(3);
  });

  it('calls onClose when the header close button is clicked', () => {
    const props = createProps();
    render(<CartDrawer {...props} />);

    const heading = screen.getByRole('heading', { name: 'Bag' });
    const closeButton =
      heading.parentElement?.parentElement?.querySelector('button');

    expect(closeButton).not.toBeNull();

    fireEvent.click(closeButton!);

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('calls onUpdateQuantity with -1 when the minus button is clicked', () => {
    const props = createProps();
    render(<CartDrawer {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '-' }));

    expect(props.onUpdateQuantity).toHaveBeenCalledWith('saree-1', -1);
  });

  it('calls onUpdateQuantity with 1 when the plus button is clicked', () => {
    const props = createProps();
    render(<CartDrawer {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '+' }));

    expect(props.onUpdateQuantity).toHaveBeenCalledWith('saree-1', 1);
  });

  it('removes an item when the remove button is clicked', () => {
    const props = createProps();
    render(<CartDrawer {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }));

    expect(props.onRemoveItem).toHaveBeenCalledWith('saree-1');
  });

  it('shows the empty bag message when there are no items', () => {
    render(<CartDrawer {...createProps({ items: [] })} />);

    expect(screen.getByText('Your Bag is Empty')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Confirm Order' }),
    ).not.toBeInTheDocument();
  });

  it('calculates subtotal, free shipping and total for orders of at least ₹2500', () => {
    render(<CartDrawer {...createProps()} />);

    expect(screen.getByText('Subtotal').parentElement).toHaveTextContent(
      '₹ 4,000',
    );
    expect(screen.getByText('Shipping').parentElement).toHaveTextContent(
      'FREE',
    );
    expect(screen.getByText('Total Amount').parentElement).toHaveTextContent(
      '₹ 4,000',
    );
  });

  it('charges ₹150 shipping when subtotal is below ₹2500', () => {
    const lowValueItem = {
      saree: { ...mockSaree, price: 1000 },
      quantity: 1,
    } as CartItem;

    render(<CartDrawer {...createProps({ items: [lowValueItem] })} />);

    expect(screen.getByText('Subtotal').parentElement).toHaveTextContent(
      '₹ 1,000',
    );
    expect(screen.getByText('Shipping').parentElement).toHaveTextContent(
      '₹ 150',
    );
    expect(screen.getByText('Total Amount').parentElement).toHaveTextContent(
      '₹ 1,150',
    );
  });

  it('shows the disabled checkout prompt when delivery details are empty', () => {
    render(<CartDrawer {...createProps()} />);

    const checkoutButton = screen.getByRole('button', {
      name: 'Enter Name, Phone & Address',
    });

    expect(checkoutButton).toBeDisabled();
  });

  it('enables checkout after delivery details are entered', () => {
    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test Customer' },
    });

    fireEvent.change(screen.getByPlaceholderText('Phone Number'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), {
      target: { value: 'Salem, Tamil Nadu' },
    });

    expect(
      screen.getByRole('button', { name: 'Confirm Order' }),
    ).toBeEnabled();
  });

  it('does not send a coupon request when the coupon field is empty', () => {
    render(<CartDrawer {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('applies a valid coupon and displays the discount', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockFetchResponse({ percent: 10 }),
    );

    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Coupon code'), {
      target: { value: 'SAVE10' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      await screen.findByText('✓ 10% discount applied'),
    ).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10' }),
    });

    expect(
      screen.getByText('Discount (10%)').parentElement,
    ).toHaveTextContent('- ₹ 400');

    expect(screen.getByText('Total Amount').parentElement).toHaveTextContent(
      '₹ 3,600',
    );
  });

  it('displays the server error when a coupon is invalid', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockFetchResponse(
        { error: 'Coupon expired.' },
        { ok: false, status: 400 },
      ),
    );

    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Coupon code'), {
      target: { value: 'EXPIRED' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Coupon expired.')).toBeInTheDocument();
  });

  it('displays a connection error when coupon fetch fails', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );

    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Coupon code'), {
      target: { value: 'SAVE10' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      await screen.findByText('Cannot reach the server.'),
    ).toBeInTheDocument();
  });

  it('places an order successfully and clears the cart', async () => {
    const props = createProps();

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockFetchResponse({
        order: { number: 12345, total: 4000 },
      }),
    );

    render(<CartDrawer {...props} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test Customer' },
    });

    fireEvent.change(screen.getByPlaceholderText('Phone Number'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), {
      target: { value: 'Salem, Tamil Nadu' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Order' }));

    expect(
      await screen.findByRole('heading', { name: 'Order Confirmed' }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Order #SBT-12345 received/),
    ).toBeInTheDocument();

    expect(screen.getByText('Test Customer')).toBeInTheDocument();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Test Customer',
          phone: '9876543210',
          address: 'Salem, Tamil Nadu',
        },
        items: [{ id: 'saree-1', quantity: 2 }],
        coupon: undefined,
      }),
    });

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledOnce();
      expect(props.onClearCart).toHaveBeenCalledOnce();
    });
  });

  it('includes the bearer token when placing an authenticated order', async () => {
    mockGetToken.mockReturnValue('test-token');

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockFetchResponse({
        order: { number: 12, total: 4000 },
      }),
    );

    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test Customer' },
    });

    fireEvent.change(screen.getByPlaceholderText('Phone Number'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), {
      target: { value: 'Salem, Tamil Nadu' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Order' }));

    await screen.findByRole('heading', { name: 'Order Confirmed' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      }),
    );
  });

  it('displays an order error when the server rejects checkout', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockFetchResponse(
        { error: 'Stock unavailable.' },
        { ok: false, status: 400 },
      ),
    );

    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test Customer' },
    });

    fireEvent.change(screen.getByPlaceholderText('Phone Number'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), {
      target: { value: 'Salem, Tamil Nadu' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Order' }));

    expect(
      await screen.findByText('Stock unavailable.'),
    ).toBeInTheDocument();
  });

  it('displays a connection error when checkout fetch fails', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );

    render(<CartDrawer {...createProps()} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test Customer' },
    });

    fireEvent.change(screen.getByPlaceholderText('Phone Number'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), {
      target: { value: 'Salem, Tamil Nadu' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Order' }));

    expect(
      await screen.findByText(
        'Cannot reach the server. Please try again.',
      ),
    ).toBeInTheDocument();
  });

  it('closes the drawer from the order confirmation screen', async () => {
    const props = createProps();

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockFetchResponse({
        order: { number: 42, total: 4000 },
      }),
    );

    render(<CartDrawer {...props} />);

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test Customer' },
    });

    fireEvent.change(screen.getByPlaceholderText('Phone Number'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(screen.getByPlaceholderText('Delivery Address'), {
      target: { value: 'Salem, Tamil Nadu' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Order' }));

    await screen.findByRole('heading', { name: 'Order Confirmed' });

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(props.onClose).toHaveBeenCalledOnce();

    expect(
      screen.queryByRole('heading', { name: 'Order Confirmed' }),
    ).not.toBeInTheDocument();
  });
});
