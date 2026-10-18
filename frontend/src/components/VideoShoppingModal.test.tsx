import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VideoShoppingModal } from './VideoShoppingModal';

const { mockUseStore } = vi.hoisted(() => ({
  mockUseStore: vi.fn(),
}));

vi.mock('../store/StoreContext', () => ({
  useStore: mockUseStore,
}));

const mockCategories = [
  { id: 'silk', name: 'Silk Sarees' },
  { id: 'cotton', name: 'Cotton Sarees' },
];

/**
 * The component's labels are not associated with their controls.
 * Find each control through the label's parent container instead.
 */
function getSelectByLabel(labelText: string): HTMLSelectElement {
  const label = screen.getByText(labelText, { exact: true });
  const select = label.parentElement?.querySelector('select');

  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`Select control not found for label: ${labelText}`);
  }

  return select;
}

function submitForm() {
  const button = screen.getByRole('button', {
    name: 'Confirm Slot',
  });

  const form = button.closest('form');

  if (!form) {
    throw new Error('Video shopping form was not found');
  }

  fireEvent.submit(form);
}

function fillCustomerDetails() {
  fireEvent.change(screen.getByPlaceholderText('Your name'), {
    target: { value: 'Ragul' },
  });

  fireEvent.change(screen.getByPlaceholderText('Phone number'), {
    target: { value: '9876543210' },
  });
}

describe('VideoShoppingModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseStore.mockReturnValue({
      categories: mockCategories,
    });
  });

  it('renders nothing when the modal is closed', () => {
    const { container } = render(
      <VideoShoppingModal isOpen={false} onClose={onClose} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the video shopping form when open', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    expect(
      screen.getByRole('heading', { name: 'Video Shopping' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Confirm Slot' }),
    ).toBeInTheDocument();

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Phone number'),
    ).toBeInTheDocument();
  });

  it('renders the categories supplied by the store', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    expect(
      screen.getByRole('option', { name: 'Silk Sarees' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', { name: 'Cotton Sarees' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', { name: 'Any' }),
    ).toBeInTheDocument();
  });

  it('allows the customer to select a category', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    const categorySelect = getSelectByLabel('Category');

    fireEvent.change(categorySelect, {
      target: { value: 'Cotton Sarees' },
    });

    expect(categorySelect).toHaveValue('Cotton Sarees');
  });

  it('allows the customer to change the preferred date', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    const dateSelect = getSelectByLabel('Preferred Date');

    fireEvent.change(dateSelect, {
      target: { value: 'This Weekend' },
    });

    expect(dateSelect).toHaveValue('This Weekend');
  });

  it('allows the customer to change the preferred time', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    const timeSelect = getSelectByLabel('Daylight Time Slot');
    const preferredTime = 'Golden Hour (04:30 PM – 06:30 PM)';

    fireEvent.change(timeSelect, {
      target: { value: preferredTime },
    });

    expect(timeSelect).toHaveValue(preferredTime);
  });

  it('allows the customer to select a meeting platform', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    const platformSelect = getSelectByLabel('Platform');

    fireEvent.change(platformSelect, {
      target: { value: 'Google Meet' },
    });

    expect(platformSelect).toHaveValue('Google Meet');
  });

  it('allows the customer to select a language', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    const languageSelect = getSelectByLabel('Language');

    fireEvent.change(languageSelect, {
      target: { value: 'Telugu' },
    });

    expect(languageSelect).toHaveValue('Telugu');
  });

  it('updates the customer name and phone fields', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    fillCustomerDetails();

    expect(screen.getByPlaceholderText('Your name')).toHaveValue('Ragul');

    expect(screen.getByPlaceholderText('Phone number')).toHaveValue(
      '9876543210',
    );
  });

  it('calls onClose when the close button is clicked', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByText('close'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the reserved slot after form submission', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    fillCustomerDetails();
    submitForm();

    expect(
      screen.getByRole('heading', { name: 'Slot Reserved' }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /We will start the WhatsApp Video session on Tomorrow at Morning Daylight \(10:30 AM\) in Tamil & English\./,
      ),
    ).toBeInTheDocument();
  });

  it('generates a WhatsApp confirmation link with the selected details', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    fireEvent.change(getSelectByLabel('Category'), {
      target: { value: 'Silk Sarees' },
    });

    fireEvent.change(getSelectByLabel('Preferred Date'), {
      target: { value: 'This Weekend' },
    });

    fireEvent.change(getSelectByLabel('Daylight Time Slot'), {
      target: { value: 'Golden Hour (04:30 PM – 06:30 PM)' },
    });

    fireEvent.change(getSelectByLabel('Platform'), {
      target: { value: 'Google Meet' },
    });

    fireEvent.change(getSelectByLabel('Language'), {
      target: { value: 'Telugu' },
    });

    fillCustomerDetails();
    submitForm();

    const link = screen.getByRole('link', {
      name: 'Send Confirmation on WhatsApp',
    });

    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/917358616601?text='),
    );

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const href = link.getAttribute('href');

    if (!href) {
      throw new Error('WhatsApp confirmation URL was not generated');
    }

    const encodedMessage = new URL(href).searchParams.get('text');

    expect(encodedMessage).not.toBeNull();

    const message = encodedMessage!;

    expect(message).toContain('Name: Ragul');
    expect(message).toContain('Mobile: 9876543210');
    expect(message).toContain('Interest: Silk Sarees');
    expect(
      message,
    ).toContain(
      'Preferred Time: This Weekend at Golden Hour (04:30 PM – 06:30 PM)',
    );
    expect(message).toContain('Platform: Google Meet');
    expect(message).toContain('Language: Telugu');
  });

  it('uses fallback customer details when the fields are empty', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    // Submit directly to exercise the handler's fallback logic.
    submitForm();

    const link = screen.getByRole('link', {
      name: 'Send Confirmation on WhatsApp',
    });

    const href = link.getAttribute('href');

    if (!href) {
      throw new Error('WhatsApp confirmation URL was not generated');
    }

    const message = new URL(href).searchParams.get('text');

    expect(message).toContain('Name: Handloom Patron');
    expect(message).toContain('Mobile: Phone number');
    expect(message).toContain('Interest: ');
  });

  it('closes the modal when Return to Collection is clicked', () => {
    render(<VideoShoppingModal isOpen onClose={onClose} />);

    fillCustomerDetails();
    submitForm();

    fireEvent.click(
      screen.getByRole('button', { name: 'Return to Collection' }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});
