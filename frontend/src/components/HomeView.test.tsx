
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HomeView } from './HomeView';
import { useStore } from '../store/StoreContext';
import type { Saree } from '../types';

vi.mock('../store/StoreContext', () => ({
  useStore: vi.fn(),
}));

const mockSarees = [
  {
    id: 'saree-1',
    name: 'Kanchipuram Silk Saree',
    sku: 'SKU-001',
    price: 5000,
    mainImage: '/images/saree-1.jpg',
    categoryId: 'silk',
  },
  {
    id: 'saree-2',
    name: 'Cotton Saree',
    sku: 'SKU-002',
    price: 1500,
    mainImage: '/images/saree-2.jpg',
    categoryId: 'cotton',
  },
  {
    id: 'saree-3',
    name: 'Banarasi Saree',
    sku: 'SKU-003',
    price: 7500,
    mainImage: '/images/saree-3.jpg',
    categoryId: 'silk',
  },
  {
    id: 'saree-4',
    name: 'Soft Silk Saree',
    sku: 'SKU-004',
    price: 3500,
    mainImage: '/images/saree-4.jpg',
    categoryId: 'silk',
  },
  {
    id: 'saree-5',
    name: 'Linen Saree',
    sku: 'SKU-005',
    price: 2200,
    mainImage: '/images/saree-5.jpg',
    categoryId: 'linen',
  },
] as Saree[];

const mockCategories = [
  {
    id: 'silk',
    name: 'Silk Sarees',
    shortName: 'Silk',
    heroImage: '/images/silk.jpg',
  },
  {
    id: 'cotton',
    name: 'Cotton Sarees',
    shortName: 'Cotton',
    heroImage: '/images/cotton.jpg',
  },
  {
    id: 'linen',
    name: 'Linen Sarees',
    shortName: 'Linen',
    heroImage: '/images/linen.jpg',
  },
];

const onSelectCategory = vi.fn();
const onSelectSaree = vi.fn();

function renderHomeView(sarees = mockSarees) {
  vi.mocked(useStore).mockReturnValue({
    sarees,
    categories: mockCategories,
  } as ReturnType<typeof useStore>);

  return render(
    <HomeView
      onSelectCategory={onSelectCategory}
      onSelectSaree={onSelectSaree}
      onToggleWishlist={vi.fn()}
      wishlistIds={[]}
      onOpenVideoModal={vi.fn()}
      onAddToCart={vi.fn()}
    />,
  );
}

function getCollectionButtons() {
  return screen
    .getAllByRole('button')
    .filter((button) =>
      button.className.includes('group text-left cursor-pointer'),
    );
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Just In, Collections, and All Categories sections', () => {
    renderHomeView();

    expect(
      screen.getByRole('heading', { name: 'Just In' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Collections' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'All Categories' }),
    ).toBeInTheDocument();
  });

  it('shows the four most recently added sarees in reverse order', () => {
    renderHomeView();

    expect(screen.getByText('Linen Saree')).toBeInTheDocument();
    expect(screen.getByText('Soft Silk Saree')).toBeInTheDocument();
    expect(screen.getByText('Banarasi Saree')).toBeInTheDocument();
    expect(screen.getByText('Cotton Saree')).toBeInTheDocument();

    expect(
      screen.queryByText('Kanchipuram Silk Saree'),
    ).not.toBeInTheDocument();
  });

  it('shows the total saree count in View All', () => {
    renderHomeView();

    expect(
      screen.getByRole('button', { name: 'View All (5) →' }),
    ).toBeInTheDocument();
  });

  it('calls onSelectCategory with undefined when View All is clicked', () => {
    renderHomeView();

    fireEvent.click(
      screen.getByRole('button', { name: 'View All (5) →' }),
    );

    expect(onSelectCategory).toHaveBeenCalledWith(undefined);
  });

  it('opens the selected saree when its card is clicked', () => {
    renderHomeView();

    fireEvent.click(screen.getByText('Linen Saree'));

    expect(onSelectSaree).toHaveBeenCalledWith(mockSarees[4]);
  });

  it('renders the correct saree images and alt text', () => {
    renderHomeView();

    const image = screen.getByRole('img', { name: 'Linen Saree' });

    expect(image).toHaveAttribute('src', '/images/saree-5.jpg');
    expect(image).toHaveAttribute('referrerPolicy', 'no-referrer');
  });

  it('renders all collection names and images', () => {
    renderHomeView();

    expect(screen.getByText('Silk')).toBeInTheDocument();
    expect(screen.getByText('Cotton')).toBeInTheDocument();
    expect(screen.getByText('Linen')).toBeInTheDocument();

    expect(
      screen.getByRole('img', { name: 'Silk Sarees' }),
    ).toHaveAttribute('src', '/images/silk.jpg');
  });

  it('shows the correct saree count for each collection', () => {
    renderHomeView();

    const collectionButtons = getCollectionButtons();

    expect(collectionButtons).toHaveLength(3);

    expect(
      within(collectionButtons[0]).getByText('3 sarees'),
    ).toBeInTheDocument();

    expect(
      within(collectionButtons[1]).getByText('1 saree'),
    ).toBeInTheDocument();

    expect(
      within(collectionButtons[2]).getByText('1 saree'),
    ).toBeInTheDocument();
  });

  it('filters by category when a collection card is clicked', () => {
    renderHomeView();

    const silkCollection = getCollectionButtons().find(
      (button) => within(button).queryByText('Silk') !== null,
    );

    expect(silkCollection).toBeDefined();

    fireEvent.click(silkCollection!);

    expect(onSelectCategory).toHaveBeenCalledWith('silk');
  });

  it('renders numbered categories in All Categories', () => {
    renderHomeView();

    const categoryList = screen.getByRole('list');
    const buttons = within(categoryList).getAllByRole('button');

    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('01');
    expect(buttons[1]).toHaveTextContent('02');
    expect(buttons[2]).toHaveTextContent('03');
  });

  it('selects a category from the All Categories list', () => {
    renderHomeView();

    const categoryList = screen.getByRole('list');

    fireEvent.click(
      within(categoryList).getByRole('button', {
        name: /Cotton Sarees/,
      }),
    );

    expect(onSelectCategory).toHaveBeenCalledWith('cotton');
  });

  it('renders an empty Just In section when there are no sarees', () => {
    renderHomeView([]);

    expect(
      screen.getByRole('button', { name: 'View All (0) →' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Collections' }),
    ).toBeInTheDocument();
  });
});
