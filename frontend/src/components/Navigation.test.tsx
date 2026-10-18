
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from './Navigation';

const createProps = () => ({
  currentView: 'home' as 'home' | 'categories' | 'account',
  onNavigate: vi.fn(),
  cartCount: 2,
  wishlistCount: 3,
  onOpenCart: vi.fn(),
  onOpenWishlist: vi.fn(),
  onOpenSearch: vi.fn(),
  onOpenVideoModal: vi.fn(),
  onOpenAccount: vi.fn(),
  isLoggedIn: false,
});

describe('Navigation', () => {
  it('renders the main navigation and store branding', () => {
    render(<Navigation {...createProps()} />);

    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sarees' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Sri Bhagyalakshmi Textiles home',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText('Sri Bhagyalakshmi Textiles SBT emblem'),
    ).toBeInTheDocument();
  });

  it('navigates home when Home is clicked', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));

    expect(props.onNavigate).toHaveBeenCalledWith('home');
  });

  it('navigates to categories when Sarees is clicked', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sarees' }));

    expect(props.onNavigate).toHaveBeenCalledWith('categories');
  });

  it('navigates home when the store logo is clicked', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sri Bhagyalakshmi Textiles home',
      }),
    );

    expect(props.onNavigate).toHaveBeenCalledWith('home');
  });

  it('opens search when Search is clicked', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(props.onOpenSearch).toHaveBeenCalledOnce();
  });

  it('opens the wishlist and displays its count', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Wishlist' }));

    expect(props.onOpenWishlist).toHaveBeenCalledOnce();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not display a wishlist count when the count is zero', () => {
    const props = { ...createProps(), wishlistCount: 0 };
    render(<Navigation {...props} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows Login when the user is not logged in', () => {
    render(<Navigation {...createProps()} />);

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('shows My account when the user is logged in', () => {
    const props = { ...createProps(), isLoggedIn: true };
    render(<Navigation {...props} />);

    expect(
      screen.getByRole('button', { name: 'My account' }),
    ).toBeInTheDocument();
  });

  it('opens the account when the account button is clicked', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(props.onOpenAccount).toHaveBeenCalledOnce();
  });

  it('opens video shopping when its button is clicked', () => {
    const props = createProps();
    render(<Navigation {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Video shopping' }));

    expect(props.onOpenVideoModal).toHaveBeenCalledOnce();
  });

  it('applies active styling to the categories navigation link', () => {
    const props = { ...createProps(), currentView: 'categories' as const };
    render(<Navigation {...props} />);

    expect(screen.getByRole('button', { name: 'Sarees' }))
      .toHaveClass('font-semibold');
  });

  it('applies active styling to the account button on the account view', () => {
    const props = { ...createProps(), currentView: 'account' as const };
    render(<Navigation {...props} />);

    expect(screen.getByRole('button', { name: 'Login' }))
      .toHaveClass('text-[#c89d42]');
  });
});
