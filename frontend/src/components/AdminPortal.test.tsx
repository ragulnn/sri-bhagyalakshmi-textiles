import React from 'react';
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
  within,
} from '@testing-library/react';
import { AdminPortal } from './AdminPortal';

const { mockUseStore, mockSave, mockReload } = vi.hoisted(() => ({
  mockUseStore: vi.fn(),
  mockSave: vi.fn(),
  mockReload: vi.fn(),
}));

vi.mock('../store/StoreContext', () => ({
  useStore: mockUseStore,
}));

vi.mock('./AdminOrders', () => ({
  AdminOrders: ({ onStatus }: { orders: unknown[]; onStatus: (order: { id: string; status?: string }, status: string) => void }) => (
    <div data-testid="admin-orders">
      Orders panel
      <button type="button" onClick={() => onStatus({ id: 'order-1', status: 'pending' }, 'shipped')}>
        Test mark order shipped
      </button>
    </div>
  ),
}));

vi.mock('./AdminSecurity', () => ({
  AdminSecurity: () => (
    <div data-testid="admin-security">Security panel</div>
  ),
}));

const category = {
  id: 'silk-sarees',
  name: 'Silk Sarees',
  shortName: 'Silk',
  count: 0,
  startingPrice: 1000,
  heroImage: '',
  description: '',
  features: [],
};

const saree = {
  id: 'saree-1',
  sku: 'SB001',
  name: 'Kanjivaram Silk Saree',
  categoryId: 'silk-sarees',
  category: 'Silk Sarees',
  price: 9000,
  originalPrice: 9000,
  stockQuantity: 4,
  inStock: true,
  mainImage: '/saree.jpg',
  fullImage: '',
  colors: [],
  colorName: 'Red',
  colorHex: '#ff0000',
  gallery: ['/saree.jpg'],
};

const customer = {
  id: 'customer-1',
  name: 'Test Customer',
  phone: '9876543210',
  email: 'customer@example.com',
  address: 'Salem',
  createdAt: '2026-01-10T00:00:00.000Z',
  favourites: ['saree-1'],
};

const jsonResponse = (data: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  }) as unknown as Response;

const mockDefaultFetch = () =>
  vi.fn().mockImplementation(async (url: string | URL | Request) => {
    const path = String(url);

    if (path === '/api/admin/orders') {
      return jsonResponse({ orders: [] });
    }

    if (path === '/api/admin/2fa/status') {
      return jsonResponse({ enabled: true });
    }

    if (path === '/api/admin/customers') {
      return jsonResponse({ customers: [customer] });
    }

    return jsonResponse({});
  });

describe('AdminPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    mockSave.mockResolvedValue(undefined);
    mockReload.mockResolvedValue(undefined);

    mockUseStore.mockReturnValue({
      categories: [category],
      sarees: [saree],
      save: mockSave,
      reload: mockReload,
      offline: false,
      loading: false,
    });

    vi.stubGlobal('fetch', mockDefaultFetch());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the login form when no token exists', () => {
    render(<AdminPortal />);

    expect(
      screen.getByRole('heading', { name: 'Admin portal' }),
    ).toBeTruthy();

    expect(
      screen.getByRole('button', { name: 'Sign in securely' }),
    ).toBeTruthy();
  });

  it('shows the dashboard when a token exists', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByTestId('admin-orders')).toBeTruthy();
  });

  it('opens the categories tab', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /categories/i }),
    );

    expect(screen.getByText('Silk Sarees')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /\+ new category/i }),
    ).toBeTruthy();
  });

  it('opens the sarees tab', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /sarees/i }),
    );

    expect(screen.getByText('Kanjivaram Silk Saree')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /\+ new saree/i }),
    ).toBeTruthy();
  });

  it('loads customers when the customers tab is opened', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /customers/i }),
    );

    expect(
      await screen.findByText('Test Customer'),
    ).toBeTruthy();

    expect(
      screen.getByText('9876543210 · customer@example.com'),
    ).toBeTruthy();
  });

  it('opens the security tab', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /security/i }),
    );

    expect(screen.getByTestId('admin-security')).toBeTruthy();
  });

  it('logs out and clears the stored token', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /log out/i }),
    );

    expect(
      sessionStorage.getItem('sbt_admin_token'),
    ).toBeNull();

    expect(
      screen.getByRole('button', { name: 'Sign in securely' }),
    ).toBeTruthy();
  });

  it('prevents deleting a category that still has sarees', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /categories/i }),
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /^delete$/i }),
    );

    expect(
      await screen.findByText(/still has 1 saree/i),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('validates an empty category name', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /categories/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /\+ new category/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /save category/i }),
    );

    expect(
      await screen.findByText('Category name is required.'),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('rejects a duplicate category name', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /categories/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /\+ new category/i }),
    );

    const categoryForm = screen
      .getByRole('heading', { name: 'New category' })
      .closest('form');

    expect(categoryForm).not.toBeNull();

    const categoryInputs = within(categoryForm as HTMLFormElement)
      .getAllByRole('textbox');

    fireEvent.change(categoryInputs[0], {
      target: { value: 'Silk Sarees' },
    });

    fireEvent.click(
      within(categoryForm as HTMLFormElement).getByRole('button', {
        name: /save category/i,
      }),
    );

    expect(
      await screen.findByText(
        'A category with this name already exists.',
      ),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('validates the saree code when creating a saree', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /sarees/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /\+ new saree/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /save saree/i }),
    );

    expect(
      await screen.findByText('Saree code is required.'),
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('allows cancelling category creation', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /categories/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /\+ new category/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /^cancel$/i }),
    );

    expect(
      screen.getByRole('button', { name: /\+ new category/i }),
    ).toBeTruthy();
  });

  it('allows cancelling saree creation', () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /sarees/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /\+ new saree/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /^cancel$/i }),
    );

    expect(
      screen.getByRole('button', { name: /\+ new saree/i }),
    ).toBeTruthy();
  });

  it('shows an error when loading customers fails', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    vi.mocked(fetch).mockImplementation(
      async (url: string | URL | Request) => {
        const path = String(url);

        if (path === '/api/admin/customers') {
          throw new Error('Network unavailable');
        }

        if (path === '/api/admin/orders') {
          return jsonResponse({ orders: [] });
        }

        if (path === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: true });
        }

        return jsonResponse({});
      },
    );

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /customers/i }),
    );

    expect(
      await screen.findByText('Could not load customers.'),
    ).toBeTruthy();
  });

  it('shows an error when customer deletion fails', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    vi.stubGlobal('confirm', vi.fn(() => true));

    vi.mocked(fetch).mockImplementation(
      async (url: string | URL | Request) => {
        const path = String(url);

        if (path === '/api/admin/customers') {
          return jsonResponse({ customers: [customer] });
        }

        if (path === '/api/admin/customers/customer-1') {
          return jsonResponse({ error: 'Deletion failed' }, 500);
        }

        if (path === '/api/admin/orders') {
          return jsonResponse({ orders: [] });
        }

        if (path === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: true });
        }

        return jsonResponse({});
      },
    );

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /customers/i }),
    );

    await screen.findByText('Test Customer');

    fireEvent.click(
      screen.getByRole('button', { name: /^delete$/i }),
    );

    expect(
      await screen.findByText('Could not delete the customer.'),
    ).toBeTruthy();
  });

  it('shows the backend error when a password reset fails', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');

    vi.stubGlobal('prompt', vi.fn(() => 'newpassword123'));

    vi.mocked(fetch).mockImplementation(
      async (url: string | URL | Request) => {
        const path = String(url);

        if (path === '/api/admin/customers') {
          return jsonResponse({ customers: [customer] });
        }

        if (path === '/api/admin/customers/customer-1/password') {
          return jsonResponse(
            { error: 'Password reset rejected' },
            500,
          );
        }

        if (path === '/api/admin/orders') {
          return jsonResponse({ orders: [] });
        }

        if (path === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: true });
        }

        return jsonResponse({});
      },
    );

    render(<AdminPortal />);

    fireEvent.click(
      screen.getByRole('button', { name: /customers/i }),
    );

    await screen.findByText('Test Customer');

    fireEvent.click(
      screen.getByRole('button', { name: /reset password/i }),
    );

    expect(
      await screen.findByText('Password reset rejected'),
    ).toBeTruthy();
  });


  it('cancels category deletion when confirmation is declined', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('confirm', vi.fn(() => false));
    mockUseStore.mockReturnValue({
      categories: [{ ...category, id: 'empty-category', name: 'Empty Category' }],
      sarees: [],
      save: mockSave,
      reload: mockReload,
      offline: false,
      loading: false,
    });

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /categories/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^delete$/i }));

    expect(confirm).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('deletes a saree after confirmation', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^delete$/i }));

    expect(confirm).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    expect(await screen.findByText('Saree deleted.')).toBeTruthy();
  });

  it('does not delete a saree when confirmation is declined', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('confirm', vi.fn(() => false));

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^delete$/i }));

    expect(confirm).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('resets a customer password successfully', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('prompt', vi.fn(() => 'newpassword123'));

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /customers/i }));
    await screen.findByText('Test Customer');
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(
      'Password changed. Share it with the customer.',
    )).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/customers/customer-1/password',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not send a password reset when the prompt is cancelled', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('prompt', vi.fn(() => null));

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /customers/i }));
    await screen.findByText('Test Customer');
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(prompt).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalledWith(
      '/api/admin/customers/customer-1/password',
      expect.anything(),
    );
  });

  it('deletes a customer after confirmation', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /customers/i }));
    await screen.findByText('Test Customer');
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(await screen.findByText('Customer deleted.')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/customers/customer-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('does not delete a customer when confirmation is declined', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('confirm', vi.fn(() => false));

    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /customers/i }));
    await screen.findByText('Test Customer');
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(confirm).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalledWith(
      '/api/admin/customers/customer-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });


  it('saves a new category and generates its slug', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /categories/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ new category/i }));

    const form = screen.getByRole('heading', { name: 'New category' }).closest('form') as HTMLFormElement;
    const fields = within(form).getAllByRole('textbox');
    fireEvent.change(fields[0], { target: { value: 'Cotton & Linen' } });
    fireEvent.change(fields[1], { target: { value: 'Cotton' } });
    fireEvent.click(within(form).getByRole('button', { name: /save category/i }));

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      categories: expect.arrayContaining([expect.objectContaining({
        id: 'cotton-linen', name: 'Cotton & Linen', shortName: 'Cotton',
      })]),
      sarees: [saree],
    }), 'test-token');
    expect(await screen.findByText('Category saved.')).toBeTruthy();
  });

  it('updates an existing category', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /categories/i }));
    const categoryRow = screen.getByText('Silk Sarees').closest('div');
    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    fireEvent.click(editButtons[0]);

    const form = screen.getByRole('heading', { name: 'Edit category' }).closest('form') as HTMLFormElement;
    const fields = within(form).getAllByRole('textbox');
    fireEvent.change(fields[0], { target: { value: 'Premium Silk' } });
    fireEvent.click(within(form).getByRole('button', { name: /save category/i }));

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
      categories: [expect.objectContaining({ id: 'silk-sarees', name: 'Premium Silk' })],
      sarees: [expect.objectContaining({ category: 'Premium Silk' })],
    }), 'test-token');
    expect(await screen.findByText('Category saved.')).toBeTruthy();
    void categoryRow;
  });

  it('shows an error when saving a category fails', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    mockSave.mockRejectedValueOnce(new Error('Save unavailable'));
    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /categories/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ new category/i }));
    const form = screen.getByRole('heading', { name: 'New category' }).closest('form') as HTMLFormElement;
    fireEvent.change(within(form).getAllByRole('textbox')[0], { target: { value: 'Cotton' } });
    fireEvent.click(within(form).getByRole('button', { name: /save category/i }));
    expect(await screen.findByText('Save unavailable')).toBeTruthy();
  });

  it('deletes an empty category after confirmation', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.stubGlobal('confirm', vi.fn(() => true));
    mockUseStore.mockReturnValue({
      categories: [{ ...category, id: 'empty-category', name: 'Empty Category' }],
      sarees: [], save: mockSave, reload: mockReload, offline: false, loading: false,
    });
    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /categories/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^delete$/i }));
    expect(mockSave).toHaveBeenCalledWith({ categories: [], sarees: [] }, 'test-token');
    expect(await screen.findByText('Category deleted.')).toBeTruthy();
  });

  it('validates a missing saree name', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ new saree/i }));
    const form = screen.getByRole('heading', { name: 'New saree' }).closest('form') as HTMLFormElement;
    const fields = within(form).getAllByRole('textbox');
    fireEvent.change(fields[0], { target: { value: 'SB002' } });
    fireEvent.change(within(form).getAllByRole('spinbutton')[0], { target: { value: '2500' } });
    fireEvent.click(within(form).getByRole('button', { name: /save saree/i }));
    expect(await screen.findByText('Name is required.')).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('validates a missing main saree photo', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    render(<AdminPortal />);
    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ new saree/i }));
    const form = screen.getByRole('heading', { name: 'New saree' }).closest('form') as HTMLFormElement;
    const textboxes = within(form).getAllByRole('textbox');
    fireEvent.change(textboxes[0], { target: { value: 'SB002' } });
    fireEvent.change(textboxes[1], { target: { value: 'New Silk Saree' } });
    const numbers = within(form).getAllByRole('spinbutton');
    fireEvent.change(numbers[0], { target: { value: '2500' } });
    fireEvent.click(within(form).getByRole('button', { name: /save saree/i }));
    expect(await screen.findByText('Upload the main saree photo.')).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });


  it('validates a negative saree price', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    render(<AdminPortal />);

    fireEvent.click(screen.getByRole('button', { name: /sarees/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ new saree/i }));

    const form = screen
      .getByRole('heading', { name: 'New saree' })
      .closest('form') as HTMLFormElement;

    const inputs = within(form).getAllByRole('textbox');
    const priceInput = within(form).getAllByRole('spinbutton')[0];
    
    // Fill fields checked before the price validation.
    fireEvent.change(inputs[0], {
      target: { value: 'SB-NEG-001' },
    });

    fireEvent.change(inputs[1], {
      target: { value: 'Test Saree' },
    });

    fireEvent.change(priceInput, {
      target: { value: '-1' },
    });

    // Bypass native HTML validation and test the React handler.
    form.noValidate = true;
    fireEvent.submit(form);

    expect(
      await screen.findByText('Enter a valid price.')
    ).toBeTruthy();

    expect(mockSave).not.toHaveBeenCalled();
  });
  it('submits an order status update and refreshes orders', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    render(<AdminPortal />);
    fireEvent.click(await screen.findByRole('button', { name: /test mark order shipped/i }));
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/orders/order-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ status: 'shipped' }),
    })));
    await vi.waitFor(() => expect(mockReload).toHaveBeenCalled());
  });

  it('shows the backend error when an order status update fails', async () => {
    sessionStorage.setItem('sbt_admin_token', 'test-token');
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const path = String(url);
      if (path === '/api/admin/orders/order-1') return jsonResponse({ error: 'Order update rejected' }, 500);
      if (path === '/api/admin/orders') return jsonResponse({ orders: [] });
      if (path === '/api/admin/2fa/status') return jsonResponse({ enabled: true });
      return jsonResponse({});
    });
    render(<AdminPortal />);
    fireEvent.click(await screen.findByRole('button', { name: /test mark order shipped/i }));
    expect(await screen.findByText('Order update rejected')).toBeTruthy();
    expect(mockReload).not.toHaveBeenCalled();
  });

});

