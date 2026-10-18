
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorSwatches } from './ColorSwatches';
import type { SareeColor } from '../types';

const colors: SareeColor[] = [
  {
    id: 'red',
    name: 'Red',
    hex: '#ff0000',
    image: '/red.jpg',
    fullImage: '/red-full.jpg',
  },
  {
    id: 'blue',
    name: 'Blue',
    hex: '#0000ff',
    image: '/blue.jpg',
    fullImage: '/blue-full.jpg',
  },
];

describe('ColorSwatches', () => {
  it('renders a button for every color', () => {
    render(<ColorSwatches colors={colors} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blue' })).toBeInTheDocument();
  });

  it('renders nothing when the colors array is empty', () => {
    const { container } = render(
      <ColorSwatches colors={[]} onSelect={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onSelect with the selected color', () => {
    const onSelect = vi.fn();

    render(<ColorSwatches colors={colors} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Red' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(colors[0]);
  });

  it('applies active styling to the selected color', () => {
    render(
      <ColorSwatches
        colors={colors}
        activeId="red"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Red' }))
      .toHaveClass('ring-2');

    expect(screen.getByRole('button', { name: 'Blue' }))
      .not.toHaveClass('ring-2');
  });

  it('uses the default size of 22 pixels', () => {
    render(<ColorSwatches colors={colors} onSelect={vi.fn()} />);

    const redButton = screen.getByRole('button', { name: 'Red' });

    expect(redButton).toHaveStyle({
      width: '22px',
      height: '22px',
    });
  });

  it('uses a custom size when provided', () => {
    render(
      <ColorSwatches
        colors={colors}
        onSelect={vi.fn()}
        size={32}
      />,
    );

    expect(screen.getByRole('button', { name: 'Red' }))
      .toHaveStyle({
        width: '32px',
        height: '32px',
      });
  });

  it('sets the background color from the color hex value', () => {
    render(<ColorSwatches colors={colors} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Red' }))
      .toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });

    expect(screen.getByRole('button', { name: 'Blue' }))
      .toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });
  });

  it('renders each color button with the button type', () => {
    render(<ColorSwatches colors={colors} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Red' }))
      .toHaveAttribute('type', 'button');
  });
});
