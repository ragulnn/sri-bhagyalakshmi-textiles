import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AdminOrders, STATUSES, type AdminOrder } from './AdminOrders';

const makeOrder = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: 'order-1',
  number: 1001,
  createdAt: '2026-10-15T10:30:00.000Z',
  status: 'new',
  customer: {
    name: 'Ragul Kumar',
    phone: '9876543210',
    address: '12 Main Road\nSalem, Tamil Nadu',
  },
  items: [
    {
      sareeId: 'saree-1',
      sku: 'SBT-001',
      name: 'Kanchipuram Silk Saree',
      colour: 'Maroon',
      price: 4500,
      quantity: 2,
      image: '/images/saree-1.jpg',
    },
  ],
  coupon: 'FESTIVE10',
  discountPercent: 10,
  subtotal: 9000,
  discount: 900,
  shipping: 100,
  total: 8200,
  ...overrides,
});

describe('AdminOrders', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the loading message when orders is null', () => {
    render(<AdminOrders orders={null} onStatus={vi.fn()} />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows all status filters with their order counts', () => {
    const orders = [
      makeOrder({ id: '1', number: 1001, status: 'new' }),
      makeOrder({ id: '2', number: 1002, status: 'confirmed' }),
      makeOrder({ id: '3', number: 1003, status: 'new' }),
      makeOrder({ id: '4', number: 1004, status: 'shipped' }),
    ];

    render(<AdminOrders orders={orders} onStatus={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'All (4)' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'new (2)' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'confirmed (1)' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'shipped (1)' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'delivered (0)' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'cancelled (0)' }),
    ).toBeInTheDocument();

    expect(STATUSES).toEqual([
      'new',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ]);
  });

  it('renders order number and customer details', () => {
    render(
      <AdminOrders orders={[makeOrder()]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('#SBT-1001')).toBeInTheDocument();
    expect(screen.getByText('Ragul Kumar')).toBeInTheDocument();

    expect(
      screen.getByText((_, element) => {
        return (
          element?.tagName === 'P' &&
          element.textContent?.replace(/\s+/g, ' ').trim() ===
            '12 Main Road Salem, Tamil Nadu'
        );
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('15/10/2026, 10:30:00 am'),
    ).toBeInTheDocument();
  });

  it('renders telephone and WhatsApp links', () => {
    render(
      <AdminOrders orders={[makeOrder()]} onStatus={vi.fn()} />,
    );

    const phoneLink = screen.getByRole('link', {
      name: '9876543210',
    });

    expect(phoneLink).toHaveAttribute(
      'href',
      'tel:+919876543210',
    );

    const whatsappLink = screen.getByRole('link', {
      name: 'WhatsApp',
    });

    expect(whatsappLink).toHaveAttribute(
      'href',
      'https://wa.me/919876543210',
    );

    expect(whatsappLink).toHaveAttribute('target', '_blank');
    expect(whatsappLink).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });

  it('renders item details, image, and formatted price', () => {
    render(
      <AdminOrders orders={[makeOrder()]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('SBT-001')).toBeInTheDocument();

    expect(
      screen.getByText('Kanchipuram Silk Saree · Maroon'),
    ).toBeInTheDocument();

    expect(screen.getByText(/2\s*×\s*₹\s*4,500/)).toBeInTheDocument();

    const image = document.querySelector(
      'img[src="/images/saree-1.jpg"]',
    );

    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('renders subtotal, coupon discount, shipping, and total', () => {
    render(
      <AdminOrders orders={[makeOrder()]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('₹9,000')).toBeInTheDocument();

    expect(
      screen.getByText('Coupon FESTIVE10 (10%)'),
    ).toBeInTheDocument();

    expect(screen.getByText('- ₹900')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('₹100')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('₹8,200')).toBeInTheDocument();
  });

  it('shows free shipping and hides the coupon row when there is no discount', () => {
    const order = makeOrder({
      discount: 0,
      discountPercent: 0,
      shipping: 0,
      total: 9000,
    });

    render(
      <AdminOrders orders={[order]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText(/Coupon/)).not.toBeInTheDocument();

    // Subtotal and total both equal ₹9,000.
    expect(screen.getAllByText('₹9,000')).toHaveLength(2);
  });

  it('calls onStatus with the selected order and new status', () => {
    const order = makeOrder();
    const onStatus = vi.fn();

    render(
      <AdminOrders orders={[order]} onStatus={onStatus} />,
    );

    fireEvent.change(screen.getByRole('combobox', {
      name: 'Order status',
    }), {
      target: { value: 'confirmed' },
    });

    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith(order, 'confirmed');
  });

  it('filters orders by status', () => {
    const orders = [
      makeOrder({ id: 'order-1', number: 1001, status: 'new' }),
      makeOrder({
        id: 'order-2',
        number: 1002,
        status: 'confirmed',
      }),
    ];

    render(
      <AdminOrders orders={orders} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('#SBT-1001')).toBeInTheDocument();
    expect(screen.getByText('#SBT-1002')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'confirmed (1)' }),
    );

    expect(screen.queryByText('#SBT-1001')).not.toBeInTheDocument();
    expect(screen.getByText('#SBT-1002')).toBeInTheDocument();
  });

  it('shows an empty state when the selected status has no orders', () => {
    render(
      <AdminOrders
        orders={[makeOrder({ status: 'new' })]}
        onStatus={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'delivered (0)' }),
    );

    expect(screen.getByText('No orders here yet.')).toBeInTheDocument();
    expect(screen.queryByText('#SBT-1001')).not.toBeInTheDocument();
  });

  it('shows an empty state when the order list is empty', () => {
    render(<AdminOrders orders={[]} onStatus={vi.fn()} />);

    expect(screen.getByText('No orders here yet.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'All (0)' }),
    ).toBeInTheDocument();
  });

  it('renders an order with no items', () => {
    const order = makeOrder({ items: [] });

    render(
      <AdminOrders orders={[order]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('#SBT-1001')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.queryByText('SBT-001')).not.toBeInTheDocument();
  });

  it('renders a separate status control for each order', () => {
    const orders = [
      makeOrder({ id: 'order-1', number: 1001, status: 'new' }),
      makeOrder({
        id: 'order-2',
        number: 1002,
        status: 'shipped',
      }),
    ];

    render(
      <AdminOrders orders={orders} onStatus={vi.fn()} />,
    );

    const statusControls = screen.getAllByRole('combobox', {
      name: 'Order status',
    });

    expect(statusControls).toHaveLength(2);
    expect(statusControls[0]).toHaveValue('new');
    expect(statusControls[1]).toHaveValue('shipped');
  });

  it('renders an item without a colour', () => {
    const order = makeOrder({
      items: [
        {
          sareeId: 'saree-2',
          sku: 'SBT-002',
          name: 'Cotton Saree',
          colour: '',
          price: 1200,
          quantity: 1,
          image: '/images/saree-2.jpg',
        },
      ],
    });

    render(
      <AdminOrders orders={[order]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('Cotton Saree')).toBeInTheDocument();
    expect(screen.queryByText('Cotton Saree ·')).not.toBeInTheDocument();
  });

  it('handles an unknown order status without crashing', () => {
    const order = makeOrder({ status: 'processing' });

    render(
      <AdminOrders orders={[order]} onStatus={vi.fn()} />,
    );

    expect(screen.getByText('#SBT-1001')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Order status' }),
    ).toBeInTheDocument();
  });

  it('returns to the All filter and displays every order', () => {
    const orders = [
      makeOrder({ id: 'order-1', number: 1001, status: 'new' }),
      makeOrder({
        id: 'order-2',
        number: 1002,
        status: 'confirmed',
      }),
    ];

    render(
      <AdminOrders orders={orders} onStatus={vi.fn()} />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'confirmed (1)' }),
    );

    expect(screen.queryByText('#SBT-1001')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'All (2)' }),
    );

    expect(screen.getByText('#SBT-1001')).toBeInTheDocument();
    expect(screen.getByText('#SBT-1002')).toBeInTheDocument();
  });
});
