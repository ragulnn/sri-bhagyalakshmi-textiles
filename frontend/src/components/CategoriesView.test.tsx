
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CategoriesView } from './CategoriesView';

const mocks = vi.hoisted(() => ({
  useStore: vi.fn(),
  getColors: vi.fn(),
  colorMain: vi.fn(),
  colorFull: vi.fn(),
  getWhatsAppOrderUrl: vi.fn(),
}));

vi.mock('../store/StoreContext', () => ({
  useStore: mocks.useStore,
}));

vi.mock('../lib/colors', () => ({
  getColors: mocks.getColors,
  colorMain: mocks.colorMain,
  colorFull: mocks.colorFull,
}));

vi.mock('../data/sareesData', () => ({
  getWhatsAppOrderUrl: mocks.getWhatsAppOrderUrl,
}));

vi.mock('./ColorSwatches', () => ({
  ColorSwatches: ({
    colors,
    activeId,
    onSelect,
  }: {
    colors: Array<{ id: string; name: string }>;
    activeId?: string;
    onSelect: (color: { id: string; name: string }) => void;
  }) => (
    <div aria-label="Saree colors">
      {colors.map((color) => (
        <button
          key={color.id}
          type="button"
          aria-pressed={activeId === color.id}
          onClick={() => onSelect(color)}
        >
          {color.name}
        </button>
      ))}
    </div>
  ),
}));

const red = { id: 'red', name: 'Red' };
const blue = { id: 'blue', name: 'Blue' };

const saree = {
  id: 'saree-1',
  name: 'Kanchipuram Silk Saree',
  sku: 'KSS-001',
  price: 12500,
  mainImage: '/images/kanchipuram.jpg',
  categoryId: 'silk',
  subtitle: 'Traditional silk',
  description: 'Traditional silk saree',
  tags: [],
  colorName: 'Red',
  colorHex: '#8b1e2d',
} as any;

const secondSaree = {
  ...saree,
  id: 'saree-2',
  name: 'Cotton Saree',
  sku: 'CS-002',
  price: 2500,
  categoryId: 'cotton',
} as any;

const categories = [
  { id: 'silk', name: 'Silk Sarees', shortName: 'Silk' },
  { id: 'cotton', name: 'Cotton Sarees', shortName: 'Cotton' },
];

const defaultProps = {
  onSelectCategory: vi.fn(),
  onSelectSaree: vi.fn(),
  onToggleWishlist: vi.fn(),
  wishlistIds: [] as string[],
  onAddToCart: vi.fn(),
};

const renderCategories = (
  props: Partial<typeof defaultProps> & {
    selectedCategoryId?: string;
  } = {},
) => {
  const allProps = { ...defaultProps, ...props };

  render(
    <CategoriesView
      {...allProps}
      onSelectCategory={allProps.onSelectCategory}
      onSelectSaree={allProps.onSelectSaree}
      onToggleWishlist={allProps.onToggleWishlist}
      wishlistIds={allProps.wishlistIds}
      onAddToCart={allProps.onAddToCart}
    />,
  );

  return allProps;
};

beforeEach(() => {
  vi.clearAllMocks();

  mocks.useStore.mockReturnValue({
    categories,
    sarees: [saree, secondSaree],
  });

  mocks.getColors.mockReturnValue([red, blue]);
  mocks.colorMain.mockImplementation(
    (_saree: unknown, color: { id: string }) =>
      `/images/${color.id}.jpg`,
  );
  mocks.colorFull.mockReturnValue(null);
  mocks.getWhatsAppOrderUrl.mockImplementation(
    (item: { id: string }, colorName?: string) =>
      `https://wa.me/911234567890?text=${item.id}-${colorName ?? ''}`,
  );
});

afterEach(() => {
  cleanup();
});

describe('CategoriesView', () => {
  it('renders the All Sarees heading, category buttons, and saree count', () => {
    renderCategories();

    expect(
      screen.getByRole('heading', { name: 'All Sarees' }),
    ).toBeInTheDocument();

    expect(screen.getByText('2 sarees')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Silk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cotton' })).toBeInTheDocument();

    expect(screen.getByText('Kanchipuram Silk Saree')).toBeInTheDocument();
    expect(screen.getByText('Cotton Saree')).toBeInTheDocument();
  });

  it('filters sarees by the selected category', () => {
    renderCategories({ selectedCategoryId: 'silk' });

    expect(
      screen.getByRole('heading', { name: 'Silk Sarees' }),
    ).toBeInTheDocument();

    expect(screen.getByText('1 saree')).toBeInTheDocument();
    expect(screen.getByText('Kanchipuram Silk Saree')).toBeInTheDocument();
    expect(screen.queryByText('Cotton Saree')).not.toBeInTheDocument();
  });

  it('calls onSelectCategory when a category button is clicked', () => {
    const props = renderCategories();

    fireEvent.click(screen.getByRole('button', { name: 'Cotton' }));

    expect(props.onSelectCategory).toHaveBeenCalledWith('cotton');
  });

  it('clears the selected category using the All button', () => {
    const props = renderCategories({ selectedCategoryId: 'silk' });

    fireEvent.click(screen.getByRole('button', { name: 'All', exact: true }));

    expect(props.onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('clears the category using the All Sarees breadcrumb', () => {
    const props = renderCategories({ selectedCategoryId: 'silk' });

    fireEvent.click(
      screen.getByRole('button', { name: 'All Sarees' }),
    );

    expect(props.onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('shows an empty state when the selected category has no sarees', () => {
    renderCategories({ selectedCategoryId: 'unknown' });

    expect(
      screen.getByText('No sarees in this category yet.'),
    ).toBeInTheDocument();

    expect(screen.getByText('0 sarees')).toBeInTheDocument();
  });

  it('calls onSelectSaree when the saree image is clicked', () => {
    const props = renderCategories();

    fireEvent.click(
      screen.getByRole('img', { name: 'Kanchipuram Silk Saree' }),
    );

    expect(props.onSelectSaree).toHaveBeenCalledWith(saree);
  });


  it('calls onToggleWishlist with the saree ID', () => {
    const props = renderCategories();

    const wishlistButtons = screen.getAllByRole('button', {
      name: 'Add to wishlist',
    });

    fireEvent.click(wishlistButtons[0]);

    expect(props.onToggleWishlist).toHaveBeenCalledWith('saree-1');
  });

  it('shows the remove-from-wishlist action for a wishlisted saree', () => {
    renderCategories({ wishlistIds: ['saree-1'] });

    expect(
      screen.getByRole('button', { name: 'Remove from wishlist' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Add to wishlist' }),
    ).toBeInTheDocument();
  });

  it('changes the displayed image and WhatsApp link when a color is selected', () => {
    renderCategories();

    const card = screen
      .getByRole('heading', { name: 'Kanchipuram Silk Saree' })
      .closest('article')!;

    fireEvent.click(within(card).getByRole('button', { name: 'Blue' }));

    expect(
      within(card).getByRole('img', { name: 'Kanchipuram Silk Saree' }),
    ).toHaveAttribute('src', '/images/blue.jpg');

    expect(mocks.getWhatsAppOrderUrl).toHaveBeenCalledWith(saree, 'Blue');
  });

  it('renders a full saree image when one is available', () => {
    mocks.colorFull.mockReturnValue('/images/full-saree.jpg');

    renderCategories();

    expect(
      screen.getAllByRole('img', { name: 'Full saree KSS-001' }).length,
    ).toBeGreaterThan(0);
  });

  it('renders the WhatsApp enquiry link for each saree', () => {
    renderCategories();

    expect(
      screen.getByRole('link', {
        name: 'Enquire about Kanchipuram Silk Saree on WhatsApp',
      }),
    ).toHaveAttribute(
      'href',
      'https://wa.me/911234567890?text=saree-1-Red',
    );

    expect(
      screen.getByRole('link', {
        name: 'Enquire about Cotton Saree on WhatsApp',
      }),
    ).toBeInTheDocument();
  });

  it('displays the online checkout notice', () => {
    renderCategories();

    expect(
      screen.getAllByText('Online checkout coming soon'),
    ).toHaveLength(2);
  });
});
