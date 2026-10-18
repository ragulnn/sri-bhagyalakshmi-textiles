
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WishlistDrawer } from './WishlistDrawer';
import type { Saree } from '../types';
import type React from 'react';

const mockSaree: Saree = {
  id: 'saree-1',
  name: 'Kanchipuram Silk Saree',
  sku: 'SBT-001',
  price: 12500,
  mainImage: '/images/kanchipuram-silk.jpg',
} as Saree;

const createProps = (
  overrides: Partial<React.ComponentProps<typeof WishlistDrawer>> = {},
) => ({
  isOpen: true,
  onClose: vi.fn(),
  wishlistSarees: [mockSaree],
  onRemoveWishlist: vi.fn(),
  onSelectSaree: vi.fn(),
  onAddToCart: vi.fn(),
  isLoggedIn: true,
  onLogin: vi.fn(),
  ...overrides,
});

describe('WishlistDrawer', () => {
  it('does not render when closed', () => {
    render(<WishlistDrawer {...createProps({ isOpen: false })} />);

    expect(screen.queryByText('Wishlist')).not.toBeInTheDocument();
  });

  it('renders the wishlist heading and item count', () => {
    render(<WishlistDrawer {...createProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Wishlist' }),
    ).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('renders the saree details', () => {
    render(<WishlistDrawer {...createProps()} />);

    expect(screen.getByText('Kanchipuram Silk Saree')).toBeInTheDocument();
    expect(screen.getByText('SBT-001')).toBeInTheDocument();
    expect(screen.getByText(/12,500/)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Kanchipuram Silk Saree' }),
    ).toHaveAttribute('src', '/images/kanchipuram-silk.jpg');
  });

  it('shows the empty wishlist message when there are no items', () => {
    render(<WishlistDrawer {...createProps({ wishlistSarees: [] })} />);

    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Move to Bag' }),
    ).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const props = createProps();
    render(<WishlistDrawer {...props} />);

    const heading = screen.getByRole('heading', { name: 'Wishlist' });
    const header = heading.parentElement?.parentElement;
    const closeButton = header?.querySelector('button');

    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('removes a saree from the wishlist', () => {
    const props = createProps();
    render(<WishlistDrawer {...props} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove from wishlist' }),
    );

    expect(props.onRemoveWishlist).toHaveBeenCalledWith('saree-1');
  });

  it('moves a saree to the bag and removes it from the wishlist', () => {
    const props = createProps();
    render(<WishlistDrawer {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to Bag' }));

    expect(props.onAddToCart).toHaveBeenCalledWith(mockSaree);
    expect(props.onRemoveWishlist).toHaveBeenCalledWith('saree-1');
  });

  it('selects a saree and closes the drawer when Inspect is clicked', () => {
    const props = createProps();
    render(<WishlistDrawer {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Inspect' }));

    expect(props.onSelectSaree).toHaveBeenCalledWith(mockSaree);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('selects a saree and closes the drawer when its image is clicked', () => {
    const props = createProps();
    render(<WishlistDrawer {...props} />);

    fireEvent.click(
      screen.getByRole('img', { name: 'Kanchipuram Silk Saree' }),
    );

    expect(props.onSelectSaree).toHaveBeenCalledWith(mockSaree);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('selects a saree and closes the drawer when its name is clicked', () => {
    const props = createProps();
    render(<WishlistDrawer {...props} />);

    fireEvent.click(screen.getByText('Kanchipuram Silk Saree'));

    expect(props.onSelectSaree).toHaveBeenCalledWith(mockSaree);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('shows the login prompt when logged out and onLogin is provided', () => {
    const props = createProps({ isLoggedIn: false });
    render(<WishlistDrawer {...props} />);

    expect(
      screen.getByRole('button', {
        name: /Login to save your favourites to your account/i,
      }),
    ).toBeInTheDocument();
  });

  it('calls onLogin when the login prompt is clicked', () => {
    const props = createProps({ isLoggedIn: false });
    render(<WishlistDrawer {...props} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /Login to save your favourites to your account/i,
      }),
    );

    expect(props.onLogin).toHaveBeenCalledOnce();
  });

  it('does not show the login prompt when logged in', () => {
    render(<WishlistDrawer {...createProps({ isLoggedIn: true })} />);

    expect(
      screen.queryByRole('button', {
        name: /Login to save your favourites to your account/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('does not show the login prompt when logged out but onLogin is absent', () => {
    render(
      <WishlistDrawer
        {...createProps({ isLoggedIn: false, onLogin: undefined })}
      />,
    );

    expect(
      screen.queryByRole('button', {
        name: /Login to save your favourites to your account/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders multiple wishlist items with the correct count', () => {
    const secondSaree = {
      ...mockSaree,
      id: 'saree-2',
      name: 'Cotton Saree',
      sku: 'SBT-002',
      price: 2500,
    };

    render(
      <WishlistDrawer
        {...createProps({ wishlistSarees: [mockSaree, secondSaree] })}
      />,
    );

    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('Kanchipuram Silk Saree')).toBeInTheDocument();
    expect(screen.getByText('Cotton Saree')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Move to Bag' }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Remove from wishlist' }),
    ).toHaveLength(2);
  });
});
