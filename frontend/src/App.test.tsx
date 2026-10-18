
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import App from './App';

const mocks = vi.hoisted(() => ({
  useStore: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('./store/StoreContext', () => ({
  useStore: mocks.useStore,
}));

vi.mock('./store/AuthContext', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('./components/AdminPortal', () => ({
  AdminPortal: () => <div>Admin portal mock</div>,
}));

vi.mock('./components/SareeCanvasHero', () => ({
  SareeCanvasHero: ({
    onExploreClick,
    onSelectCategory,
  }: any) => (
    <div>
      <button onClick={onExploreClick}>Explore collection</button>
      <button onClick={() => onSelectCategory('silk')}>
        Hero category
      </button>
    </div>
  ),
}));

vi.mock('./components/Navigation', () => ({
  Navigation: ({
    onNavigate,
    onOpenCart,
    onOpenWishlist,
    onOpenSearch,
    onOpenVideoModal,
    onOpenAccount,
  }: any) => (
    <nav>
      <button onClick={() => onNavigate('categories')}>
        Categories
      </button>
      <button onClick={onOpenCart}>Open cart</button>
      <button onClick={onOpenWishlist}>Open wishlist</button>
      <button onClick={onOpenSearch}>Open search</button>
      <button onClick={onOpenVideoModal}>Open video</button>
      <button onClick={onOpenAccount}>Open account</button>
    </nav>
  ),
}));

vi.mock('./components/HomeView', () => ({
  HomeView: () => <div>Home view mock</div>,
}));

vi.mock('./components/CategoriesView', () => ({
  CategoriesView: () => <div>Categories view mock</div>,
}));

vi.mock('./components/AccountView', () => ({
  AccountView: ({ onContinue }: any) => (
    <button onClick={onContinue}>Continue shopping</button>
  ),
}));

vi.mock('./components/CartDrawer', () => ({
  CartDrawer: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;

    return (
      <section aria-label="Cart drawer">
        <p>Cart drawer content</p>
        <button onClick={onClose}>Close cart</button>
      </section>
    );
  },
}));

vi.mock('./components/WishlistDrawer', () => ({
  WishlistDrawer: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;

    return (
      <section aria-label="Wishlist drawer">
        <p>Wishlist drawer content</p>
        <button onClick={onClose}>Close wishlist</button>
      </section>
    );
  },
}));

vi.mock('./components/VideoShoppingModal', () => ({
  VideoShoppingModal: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;

    return (
      <section aria-label="Video modal">
        <p>Video modal content</p>
        <button onClick={onClose}>Close video</button>
      </section>
    );
  },
}));

vi.mock('./components/SearchModal', () => ({
  SearchModal: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;

    return (
      <section aria-label="Search modal">
        <p>Search modal content</p>
        <button onClick={onClose}>Close search</button>
      </section>
    );
  },
}));

vi.mock('./components/SareeDetailModal', () => ({
  SareeDetailModal: () => null,
}));

vi.mock('./components/Footer', () => ({
  Footer: () => <footer>Footer mock</footer>,
}));

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';

  mocks.useStore.mockReturnValue({ sarees: [] });
  mocks.useAuth.mockReturnValue({
    user: null,
    setFavourites: vi.fn(),
  });

  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the home view and ordering notice by default', () => {
    render(<App />);

    expect(screen.getByText('Home view mock')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Online ordering is temporarily unavailable',
    );
    expect(screen.getByText('Footer mock')).toBeInTheDocument();
  });

  it('renders the admin portal when the URL hash starts with #/admin', () => {
    window.location.hash = '#/admin';

    render(<App />);

    expect(screen.getByText('Admin portal mock')).toBeInTheDocument();
    expect(screen.queryByText('Home view mock')).not.toBeInTheDocument();
  });

  it('switches to the admin portal after a hashchange event', async () => {
    render(<App />);

    window.location.hash = '#/admin/orders';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => {
      expect(screen.getByText('Admin portal mock')).toBeInTheDocument();
    });
  });

  it('opens and closes the cart drawer', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open cart' }));

    expect(
      await screen.findByRole('region', { name: 'Cart drawer' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('region', { name: 'Cart drawer' }),
      ).not.toBeInTheDocument();
    });
  });

  it('opens and closes the wishlist drawer', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open wishlist' }));

    expect(
      await screen.findByRole('region', { name: 'Wishlist drawer' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close wishlist' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('region', { name: 'Wishlist drawer' }),
      ).not.toBeInTheDocument();
    });
  });

  it('opens and closes the search modal', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));

    expect(
      await screen.findByRole('region', { name: 'Search modal' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close search' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('region', { name: 'Search modal' }),
      ).not.toBeInTheDocument();
    });
  });

  it('opens and closes the video shopping modal', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open video' }));

    expect(
      await screen.findByRole('region', { name: 'Video modal' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close video' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('region', { name: 'Video modal' }),
      ).not.toBeInTheDocument();
    });
  });

  it('navigates to categories', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));

    expect(screen.getByText('Categories view mock')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });

  it('navigates to account and returns to home', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open account' }));

    expect(
      screen.getByRole('button', { name: 'Continue shopping' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Continue shopping' }),
    );

    expect(screen.getByText('Home view mock')).toBeInTheDocument();
  });

  it('scrolls to store content when the hero explore button is clicked', () => {
    const scrollIntoView = vi.fn();

    render(<App />);

    const storeContent = document.getElementById('store-content');
    expect(storeContent).not.toBeNull();

    storeContent!.scrollIntoView = scrollIntoView;

    fireEvent.click(
      screen.getByRole('button', { name: 'Explore collection' }),
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
    });
  });

  it('loads an empty cart when saved cart JSON is invalid', () => {
    localStorage.setItem('sbt_cart', '{invalid json');

    render(<App />);

    expect(screen.getByText('Home view mock')).toBeInTheDocument();
    expect(localStorage.getItem('sbt_cart')).toBe('[]');
  });

  it('loads an empty wishlist when saved wishlist JSON is invalid', () => {
    localStorage.setItem('sbt_wishlist', '{invalid json');

    render(<App />);

    expect(localStorage.getItem('sbt_wishlist')).toBe('[]');
  });

  it('saves an empty guest wishlist to localStorage', () => {
    render(<App />);

    expect(localStorage.getItem('sbt_wishlist')).toBe('[]');
  });

  it('renders the WhatsApp contact link', () => {
    render(<App />);

    expect(
      screen.getByRole('link', {
        name: 'Chat with Sri Bhagyalakshmi Textiles on WhatsApp',
      }),
    ).toHaveAttribute('href');
  });
});
