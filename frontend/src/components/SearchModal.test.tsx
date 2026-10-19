
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchModal } from './SearchModal';
import type { Saree } from '../types';

const { mockSarees } = vi.hoisted(() => ({
  mockSarees: { current: [] as unknown[] },
}));

vi.mock('../store/StoreContext', () => ({
  useStore: () => ({
    sarees: mockSarees.current,
  }),
}));

const sarees = [
  {
    id: 'saree-1',
    name: 'Kanchipuram Silk Saree',
    sku: 'SBT-001',
    category: 'Silk',
    price: 4000,
    mainImage: '/images/kanchipuram.jpg',
    colors: [{ name: 'Red', hex: '#FF0000' }],
  },
  {
    id: 'saree-2',
    name: 'Cotton Daily Wear Saree',
    sku: 'SBT-002',
    category: 'Cotton',
    price: 1500,
    mainImage: '/images/cotton.jpg',
    colors: [{ name: 'Blue', hex: '#0000FF' }],
  },
] as unknown as Saree[];

const createProps = (
  overrides: Partial<React.ComponentProps<typeof SearchModal>> = {},
) => ({
  isOpen: true,
  onClose: vi.fn(),
  onSelectSaree: vi.fn(),
  ...overrides,
});

describe('SearchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSarees.current = sarees;
  });

  it('does not render when closed', () => {
    render(<SearchModal {...createProps({ isOpen: false })} />);

    expect(
      screen.queryByPlaceholderText('Search by name, code or colour'),
    ).not.toBeInTheDocument();
  });

  it('renders the search input and close button', () => {
    render(<SearchModal {...createProps()} />);

    expect(
      screen.getByPlaceholderText('Search by name, code or colour'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Close' }),
    ).toBeInTheDocument();
  });

  it('does not show results before entering a query', () => {
    render(<SearchModal {...createProps()} />);

    expect(
      screen.queryByRole('button', { name: /Kanchipuram Silk Saree/ }),
    ).not.toBeInTheDocument();

    expect(screen.queryByText('No sarees found.')).not.toBeInTheDocument();
  });

  it.each([
    {
      description: 'finds sarees by name without case sensitivity',
      query: 'kanchipuram',
      visible: 'Kanchipuram Silk Saree',
      hidden: 'Cotton Daily Wear Saree',
    },
    {
      description: 'finds sarees by SKU',
      query: 'SBT-002',
      visible: 'Cotton Daily Wear Saree',
      hidden: 'Kanchipuram Silk Saree',
    },
    {
      description: 'finds sarees by category',
      query: 'cotton',
      visible: 'Cotton Daily Wear Saree',
      hidden: 'Kanchipuram Silk Saree',
    },
    {
      description: 'finds sarees by colour',
      query: 'blue',
      visible: 'Cotton Daily Wear Saree',
      hidden: 'Kanchipuram Silk Saree',
    },
    {
      description: 'trims whitespace from the search query',
      query: '  SBT-001  ',
      visible: 'Kanchipuram Silk Saree',
      hidden: 'Cotton Daily Wear Saree',
    },
  ])('$description', ({ query, visible, hidden }) => {
    render(<SearchModal {...createProps()} />);

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, code or colour'),
      { target: { value: query } },
    );

    expect(screen.getByText(visible)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
  });

  it('shows a message when no sarees match the query', () => {
    render(<SearchModal {...createProps()} />);

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, code or colour'),
      { target: { value: 'nonexistent-saree' } },
    );

    expect(screen.getByText('No sarees found.')).toBeInTheDocument();
  });

  it('displays the saree image, SKU, and formatted price', () => {
    render(<SearchModal {...createProps()} />);

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, code or colour'),
      { target: { value: 'SBT-001' } },
    );

    // The image has alt="", so it is presentational rather than role="img".
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/images/kanchipuram.jpg',
    );

    expect(screen.getByText('SBT-001')).toBeInTheDocument();
    expect(screen.getByText('₹ 4,000')).toBeInTheDocument();
  });

  it('calls onSelectSaree and onClose when a result is selected', () => {
    const props = createProps();
    render(<SearchModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, code or colour'),
      { target: { value: 'SBT-001' } },
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Kanchipuram Silk Saree/ }),
    );

    expect(props.onSelectSaree).toHaveBeenCalledWith(sarees[0]);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close button is clicked', () => {
    const props = createProps();
    render(<SearchModal {...props} />);

    fireEvent.change(
      screen.getByPlaceholderText('Search by name, code or colour'),
      { target: { value: 'SBT-001' } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(props.onClose).toHaveBeenCalledOnce();
    expect(
      screen.queryByText('Kanchipuram Silk Saree'),
    ).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', () => {
    const props = createProps();
    const { container } = render(<SearchModal {...props} />);

    fireEvent.click(container.firstElementChild!);

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('does not close when the modal content is clicked', () => {
    const props = createProps();
    render(<SearchModal {...props} />);

    fireEvent.click(
      screen.getByPlaceholderText('Search by name, code or colour'),
    );

    expect(props.onClose).not.toHaveBeenCalled();
  });
});
