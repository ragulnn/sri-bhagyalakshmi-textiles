import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SareeDetailModal } from './SareeDetailModal';
import type { Saree, SareeColor } from '../types';

vi.mock('../lib/colors', () => ({
  getColors: (saree: Saree) => saree.colors ?? [],
  colorMain: (saree: Saree, color?: SareeColor) =>
    color?.image || saree.mainImage,
  colorFull: (saree: Saree, color?: SareeColor) =>
    color?.fullImage || saree.fullSareeLayImage || undefined,
}));

vi.mock('../data/sareesData', () => ({
  getWhatsAppOrderUrl: vi.fn(
    (_saree: Saree, colorName?: string) =>
      `https://wa.me/919999999999?text=${encodeURIComponent(
        `Enquiry ${colorName ?? ''}`,
      )}`,
  ),
}));

vi.mock('./ColorSwatches', () => ({
  ColorSwatches: ({
    colors,
    activeId,
    onSelect,
  }: {
    colors: SareeColor[];
    activeId?: string;
    onSelect: (color: SareeColor) => void;
    size?: number;
  }) => (
    <div aria-label="Colour options">
      {colors.map((color) => (
        <button
          type="button"
          key={color.id}
          aria-pressed={activeId === color.id}
          onClick={() => onSelect(color)}
        >
          {color.name}
        </button>
      ))}
    </div>
  ),
}));

const mockColors: SareeColor[] = [
  {
    id: 'red',
    name: 'Red',
    hex: '#ff0000',
    image: '/images/red-main.jpg',
    fullImage: '/images/red-full.jpg',
  },
  {
    id: 'blue',
    name: 'Blue',
    hex: '#0000ff',
    image: '/images/blue-main.jpg',
    fullImage: '/images/blue-full.jpg',
  },
];

const mockSaree = {
  id: 'saree-1',
  name: 'Kanchipuram Silk Saree',
  sku: 'SBT-001',
  category: 'Silk Sarees',
  categoryId: 'silk-sarees',
  subtitle: 'Traditional silk saree',
  price: 12500,
  originalPrice: 15000,
  weightGrams: 800,
  weaverOrigin: 'Kanchipuram',
  loomType: 'Handloom',
  silkMarkVerified: true,
  description: 'Traditional silk saree.',
  weaveStory: 'Woven by skilled artisans.',
  mainImage: '/images/red-main.jpg',
  galleryImages: [
    {
      id: 'gallery-1',
      url: '/images/side-view.jpg',
      title: 'Side view',
      caption: 'Side view of the saree',
    },
    {
      id: 'gallery-2',
      url: '/images/detail-view.jpg',
      title: 'Border detail',
      caption: 'Detailed border view',
    },
    {
      id: 'gallery-duplicate',
      url: '/images/red-main.jpg',
      title: 'Duplicate main image',
      caption: 'Duplicate image',
    },
  ],
  fullSareeLayImage: '/images/red-full.jpg',
  fullSareeDetails: {
    palluLength: '1 metre',
    palluMotifs: 'Traditional motifs',
    bodyPattern: 'Traditional pattern',
    borderType: 'Zari border',
    blouseIncluded: true,
    blouseLength: '1 metre',
    zariPurity: 'Tested zari',
  },
  tags: ['silk', 'traditional'],
  inStock: true,
  stockQuantity: 10,
  colorName: 'Red',
  colorHex: '#ff0000',
  colors: mockColors,
  careGuide: ['Dry clean only'],
} satisfies Saree;

function createProps(
  overrides: Partial<React.ComponentProps<typeof SareeDetailModal>> = {},
) {
  return {
    saree: mockSaree,
    onClose: vi.fn(),
    onAddToCart: vi.fn(),
    onToggleWishlist: vi.fn(),
    isWishlisted: false,
    onOpenVideoModal: vi.fn(),
    ...overrides,
  };
}

/**
 * The main preview has the object-top class.
 * This avoids matching the thumbnail, which has the same alt text.
 */
function getMainPreview(container: HTMLElement): HTMLImageElement {
  const image = container.querySelector<HTMLImageElement>('img.object-top');

  if (!image) {
    throw new Error('Main saree preview image was not found');
  }

  return image;
}

function getThumbnailButton(altText: string): HTMLElement {
  const buttons = screen.getAllByRole('button');
  const thumbnail = buttons.find(
    (button) =>
      button.querySelector('img')?.getAttribute('alt') === altText,
  );

  if (!thumbnail) {
    throw new Error(`Thumbnail button not found: ${altText}`);
  }

  return thumbnail;
}

describe('SareeDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no saree is selected', () => {
    const { container } = render(
      <SareeDetailModal {...createProps({ saree: null })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the saree name, SKU and formatted price', () => {
    render(<SareeDetailModal {...createProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Kanchipuram Silk Saree' }),
    ).toBeInTheDocument();

    expect(screen.getAllByText('SBT-001').length).toBeGreaterThan(0);
    expect(screen.getByText('₹ 12,500')).toBeInTheDocument();
  });

  it('renders the main image and gallery thumbnails', () => {
    const { container } = render(
      <SareeDetailModal {...createProps()} />,
    );

    expect(getMainPreview(container)).toHaveAttribute(
      'src',
      '/images/red-main.jpg',
    );

    expect(
      within(getThumbnailButton('Side view')).getByRole('img'),
    ).toHaveAttribute('src', '/images/side-view.jpg');

    expect(
      within(getThumbnailButton('Border detail')).getByRole('img'),
    ).toHaveAttribute('src', '/images/detail-view.jpg');

    expect(
      screen.queryByRole('img', { name: 'Duplicate main image' }),
    ).not.toBeInTheDocument();
  });

  it('changes the active image when a gallery thumbnail is clicked', () => {
    const { container } = render(
      <SareeDetailModal {...createProps()} />,
    );

    fireEvent.click(getThumbnailButton('Side view'));

    expect(getMainPreview(container)).toHaveAttribute(
      'src',
      '/images/side-view.jpg',
    );
    expect(getMainPreview(container)).toHaveAttribute('alt', 'Side view');
  });

  it('renders the available colour options', () => {
    render(<SareeDetailModal {...createProps()} />);

    expect(screen.getByText(/Colour:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blue' })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('changes the main image when a different colour is selected', () => {
    const { container } = render(
      <SareeDetailModal {...createProps()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));

    expect(getMainPreview(container)).toHaveAttribute(
      'src',
      '/images/blue-main.jpg',
    );

    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('resets the gallery and selected colour when a different saree opens', () => {
    const props = createProps();
    const { container, rerender } = render(
      <SareeDetailModal {...props} />,
    );

    fireEvent.click(getThumbnailButton('Side view'));
    fireEvent.click(screen.getByRole('button', { name: 'Blue' }));

    const nextSaree: Saree = {
      ...mockSaree,
      id: 'saree-2',
      name: 'Banarasi Silk Saree',
      sku: 'SBT-002',
      mainImage: '/images/next-main.jpg',
      fullSareeLayImage: '/images/green-full.jpg',
      colorName: 'Green',
      colorHex: '#008000',
      colors: [
        {
          id: 'green',
          name: 'Green',
          hex: '#008000',
          image: '/images/green-main.jpg',
          fullImage: '/images/green-full.jpg',
        },
      ],
      galleryImages: [
        {
          id: 'next-gallery',
          url: '/images/next-side.jpg',
          title: 'Next saree side view',
          caption: 'Side view',
        },
      ],
    };

    rerender(
      <SareeDetailModal {...props} saree={nextSaree} />,
    );

    expect(
      screen.getByRole('heading', { name: 'Banarasi Silk Saree' }),
    ).toBeInTheDocument();

    expect(getMainPreview(container)).toHaveAttribute(
      'src',
      '/images/green-main.jpg',
    );

    expect(
      within(getThumbnailButton('Next saree side view')).getByRole('img'),
    ).toBeInTheDocument();
  });

  it('calls onClose when the Close button is clicked', () => {
    const props = createProps();
    render(<SareeDetailModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('calls onToggleWishlist with the selected saree ID', () => {
    const props = createProps();
    render(<SareeDetailModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Wishlist' }));

    expect(props.onToggleWishlist).toHaveBeenCalledOnce();
    expect(props.onToggleWishlist).toHaveBeenCalledWith('saree-1');
  });

  it('renders the WhatsApp enquiry link for the selected colour', () => {
    render(<SareeDetailModal {...createProps()} />);

    const enquiryLink = screen.getByRole('link', {
      name: 'Enquire about Kanchipuram Silk Saree on WhatsApp',
    });

    expect(enquiryLink).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/'),
    );
    expect(enquiryLink).toHaveAttribute('target', '_blank');
    expect(enquiryLink).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(enquiryLink.getAttribute('href')).toContain('Red');
  });

  it('opens the full-saree image in fullscreen mode', () => {
    render(<SareeDetailModal {...createProps()} />);

    expect(
      screen.getByRole('img', { name: 'Full saree SBT-001' }),
    ).toHaveAttribute('src', '/images/red-full.jpg');

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

    expect(
      screen.getByRole('img', { name: 'SBT-001' }),
    ).toHaveAttribute('src', '/images/red-full.jpg');
  });

  it('closes fullscreen mode and returns to the regular preview', () => {
    render(<SareeDetailModal {...createProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

    expect(
      screen.getByRole('img', { name: 'SBT-001' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Close' }).at(-1)!,
    );

    expect(
      screen.queryByRole('img', { name: 'SBT-001' }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('img', { name: 'Full saree SBT-001' }),
    ).toBeInTheDocument();
  });

  it('does not render colour controls when the saree has no colours', () => {
    const sareeWithoutColors: Saree = {
      ...mockSaree,
      colors: [],
    };

    render(
      <SareeDetailModal
        {...createProps({ saree: sareeWithoutColors })}
      />,
    );

    expect(screen.queryByText(/Colour:/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Red' }),
    ).not.toBeInTheDocument();
  });

  it('does not render the full-saree section when no full image exists', () => {
    const sareeWithoutFullImage: Saree = {
      ...mockSaree,
      fullSareeLayImage: '',
      colors: [],
    };

    render(
      <SareeDetailModal
        {...createProps({ saree: sareeWithoutFullImage })}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Expand' }),
    ).not.toBeInTheDocument();
  });
});
