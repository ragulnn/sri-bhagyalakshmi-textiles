
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Footer } from './Footer';
import { useStore } from '../store/StoreContext';

vi.mock('../store/StoreContext', () => ({
  useStore: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Instagram: () => <svg data-testid="instagram-icon" />,
  Youtube: () => <svg data-testid="youtube-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
}));

const mockCategories = [
  {
    id: 'silk',
    name: 'Silk Sarees',
    shortName: 'Silk',
    heroImage: '/silk.jpg',
  },
  {
    id: 'cotton',
    name: 'Cotton Sarees',
    shortName: 'Cotton',
    heroImage: '/cotton.jpg',
  },
];

const onSelectCategory = vi.fn();

function renderFooter(categories = mockCategories) {
  vi.mocked(useStore).mockReturnValue({
    categories,
  } as ReturnType<typeof useStore>);

  return render(<Footer onSelectCategory={onSelectCategory} />);
}

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the footer branding and tagline', () => {
    renderFooter();

    expect(
      screen.getByRole('link', {
        name: 'Sri Bhagyalakshmi Textiles home',
      }),
    ).toHaveAttribute('href', '#home');

    expect(
      screen.getByRole('img', {
        name: 'Sri Bhagyalakshmi Textiles SBT emblem',
      }),
    ).toHaveAttribute('src', '/sbt-logo.png');

    expect(
      screen.getByRole('heading', {
        name: /The grandeur of silk\..*The soul of Elampillai\./,
      }),
    ).toBeInTheDocument();
  });

  it('renders the Explore navigation links', () => {
    renderFooter();

    const navigation = screen.getByRole('navigation', {
      name: 'Footer navigation',
    });

    expect(
      within(navigation).getByRole('heading', { name: 'Explore' }),
    ).toBeInTheDocument();

    expect(
      within(navigation).getByRole('button', { name: 'Collections' }),
    ).toBeInTheDocument();

    expect(
      within(navigation).getByRole('button', { name: 'Our Story' }),
    ).toBeInTheDocument();

    expect(
      within(navigation).getByRole('button', { name: 'Elampillai' }),
    ).toBeInTheDocument();

    expect(
      within(navigation).getByRole('button', { name: 'Contact' }),
    ).toBeInTheDocument();
  });

  it('calls onSelectCategory without an ID when Collections is clicked', () => {
    renderFooter();

    fireEvent.click(
      screen.getByRole('button', { name: 'Collections' }),
    );

    expect(onSelectCategory).toHaveBeenCalledTimes(1);
    expect(onSelectCategory).toHaveBeenCalledWith();
  });

  it('shows Browse all sarees when categories exist', () => {
    renderFooter();

    expect(
      screen.getByRole('button', { name: 'Browse all sarees' }),
    ).toBeInTheDocument();
  });

  it('calls onSelectCategory when Browse all sarees is clicked', () => {
    renderFooter();

    fireEvent.click(
      screen.getByRole('button', { name: 'Browse all sarees' }),
    );

    expect(onSelectCategory).toHaveBeenCalledTimes(1);
    expect(onSelectCategory).toHaveBeenCalledWith();
  });

  it('hides Browse all sarees when there are no categories', () => {
    renderFooter([]);

    expect(
      screen.queryByRole('button', { name: 'Browse all sarees' }),
    ).not.toBeInTheDocument();
  });

  it('scrolls to Our Story when that link is clicked', () => {
    const scrollIntoView = vi.fn();

    const storySection = document.createElement('section');
    storySection.id = 'our-story';
    storySection.scrollIntoView = scrollIntoView;
    document.body.appendChild(storySection);

    try {
      renderFooter();

      fireEvent.click(
        screen.getByRole('button', { name: 'Our Story' }),
      );

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    } finally {
      storySection.remove();
    }
  });

  it('scrolls to Our Story when Elampillai is clicked', () => {
    const scrollIntoView = vi.fn();

    const storySection = document.createElement('section');
    storySection.id = 'our-story';
    storySection.scrollIntoView = scrollIntoView;
    document.body.appendChild(storySection);

    try {
      renderFooter();

      fireEvent.click(
        screen.getByRole('button', { name: 'Elampillai' }),
      );

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    } finally {
      storySection.remove();
    }
  });

  it('scrolls to Contact when the Contact navigation button is clicked', () => {
    const scrollIntoView = vi.fn();

    const contactSection = document.createElement('section');
    contactSection.id = 'contact';
    contactSection.scrollIntoView = scrollIntoView;
    document.body.appendChild(contactSection);

    try {
      renderFooter();

      const navigation = screen.getByRole('navigation', {
        name: 'Footer navigation',
      });

      fireEvent.click(
        within(navigation).getByRole('button', { name: 'Contact' }),
      );

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    } finally {
      contactSection.remove();
    }
  });

  it('renders the Instagram and YouTube social links', () => {
    renderFooter();

    const instagramLinks = screen.getAllByRole('link', {
      name: /Instagram @sribhagyalakshmitextiles/,
    });

    expect(instagramLinks[0]).toHaveAttribute(
      'href',
      'https://www.instagram.com/sribhagyalakshmitextiles/',
    );

    expect(instagramLinks[0]).toHaveAttribute('target', '_blank');
    expect(instagramLinks[0]).toHaveAttribute('rel', 'noreferrer');

    const youtubeLink = screen.getByRole('link', {
      name: 'YouTube Bhagya Lakshmi Ellampillai',
    });

    expect(youtubeLink).toHaveAttribute(
      'href',
      'https://youtube.com/@bhagyalakshmiellampillai?si=n5O4juCKw5ld8PuF',
    );

    expect(youtubeLink).toHaveAttribute('target', '_blank');
    expect(youtubeLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders the phone numbers and telephone links', () => {
    renderFooter();

    expect(
      screen.getByRole('link', { name: '7358656601' }),
    ).toHaveAttribute('href', 'tel:7358656601');

    expect(
      screen.getByRole('link', { name: /8072951729/ }),
    ).toHaveAttribute('href', 'tel:8072951729');

    expect(screen.getByText('(online orders)')).toBeInTheDocument();
  });

  it('renders the store location', () => {
    renderFooter();

    expect(
      screen.getByText('Elampillai, Salem, Tamil Nadu'),
    ).toBeInTheDocument();
  });

  it('renders the social media icons', () => {
    renderFooter();

    expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('phone-icon')).toHaveLength(2);
    expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
  });

  it('renders the current year and copyright notice', () => {
    renderFooter();

    expect(
      screen.getByText(
        `© ${new Date().getFullYear()} Sri Bhagyalakshmi Textiles. All rights reserved.`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Woven with tradition · Elampillai'),
    ).toBeInTheDocument();
  });
});
