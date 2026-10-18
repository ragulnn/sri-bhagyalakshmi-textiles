
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AccountView } from './AccountView';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useStore: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  setFavourites: vi.fn(),
  getToken: vi.fn(),
  reload: vi.fn(),
  save: vi.fn(),
}));

vi.mock('../store/AuthContext', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('../store/StoreContext', () => ({
  useStore: mocks.useStore,
}));

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

const user = {
  id: 'customer-1',
  name: 'Ragul Kumar',
  phone: '9876543210',
  email: 'ragul@example.com',
  address: 'Salem, Tamil Nadu',
  favourites: ['saree-1'],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const getPasswordInput = () =>
  document.querySelector<HTMLInputElement>(
    'input[autocomplete="current-password"], input[autocomplete="new-password"]',
  );

const getRegistrationForm = () => {
  const nameInput = document.querySelector<HTMLInputElement>(
    'input[autocomplete="name"]',
  );

  if (!nameInput) {
    throw new Error('Registration name input was not found');
  }

  const form = nameInput.closest('form');

  if (!form) {
    throw new Error('Registration form was not found');
  }

  return form;
};

const getLoginForm = () => {
  const phoneInput = screen.getByPlaceholderText('98765 43210');
  const form = phoneInput.closest('form');

  if (!form) {
    throw new Error('Login form was not found');
  }

  return form;
};

const renderAccount = (options?: {
  ready?: boolean;
  loggedIn?: boolean;
  favourites?: string[];
  onContinue?: () => void;
  onSelectSaree?: (saree: any) => void;
}) => {
  const {
    ready = true,
    loggedIn = false,
    favourites = user.favourites,
    onContinue = vi.fn(),
    onSelectSaree = vi.fn(),
  } = options ?? {};

  mocks.useAuth.mockReturnValue({
    user: loggedIn ? { ...user, favourites } : null,
    ready,
    login: mocks.login,
    register: mocks.register,
    logout: mocks.logout,
    updateProfile: mocks.updateProfile,
    setFavourites: mocks.setFavourites,
    getToken: mocks.getToken,
  });

  mocks.useStore.mockReturnValue({
    categories: [],
    sarees: [saree],
    loading: false,
    offline: false,
    reload: mocks.reload,
    save: mocks.save,
  });

  render(
    <AccountView
      onContinue={onContinue}
      onSelectSaree={onSelectSaree}
    />,
  );

  return { onContinue, onSelectSaree };
};

beforeEach(() => {
  vi.clearAllMocks();

  mocks.login.mockResolvedValue(undefined);
  mocks.register.mockResolvedValue(undefined);
  mocks.logout.mockResolvedValue(undefined);
  mocks.updateProfile.mockResolvedValue(undefined);
  mocks.setFavourites.mockResolvedValue(undefined);
  mocks.getToken.mockReturnValue('test-token');

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ orders: [] }),
    }),
  );

  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AccountView', () => {
  it('shows the account heading while authentication is not ready', () => {
    renderAccount({ ready: false });

    expect(
      screen.getByRole('heading', {
        name: 'Login or create an account',
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByPlaceholderText('98765 43210'),
    ).not.toBeInTheDocument();
  });

  it('renders the login form when logged out', () => {
    renderAccount();

    expect(
      screen.getByRole('heading', {
        name: 'Login or create an account',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('98765 43210'),
    ).toBeInTheDocument();

    expect(getPasswordInput()).toHaveAttribute(
      'autocomplete',
      'current-password',
    );

    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeInTheDocument();
  });

  it('submits the login form and scrolls to the top on success', async () => {
    renderAccount();

    fireEvent.change(screen.getByPlaceholderText('98765 43210'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(getPasswordInput()!, {
      target: { value: 'password123' },
    });

    fireEvent.submit(getLoginForm());

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith(
        '9876543210',
        'password123',
      );
    });

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
    });
  });

  it('displays a login error when authentication fails', async () => {
    mocks.login.mockRejectedValueOnce(
      new Error('Invalid phone number or password'),
    );

    renderAccount();

    fireEvent.change(screen.getByPlaceholderText('98765 43210'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(getPasswordInput()!, {
      target: { value: 'wrong-password' },
    });

    fireEvent.submit(getLoginForm());

    expect(
      await screen.findByText('Invalid phone number or password'),
    ).toBeInTheDocument();
  });

  it('shows a helpful message when the server cannot be reached', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Failed to fetch'));

    renderAccount();

    fireEvent.change(screen.getByPlaceholderText('98765 43210'), {
      target: { value: '9876543210' },
    });

    fireEvent.change(getPasswordInput()!, {
      target: { value: 'password123' },
    });

    fireEvent.submit(getLoginForm());

    expect(
      await screen.findByText(
        'Cannot reach the server. Please try again.',
      ),
    ).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderAccount();

    const password = getPasswordInput()!;

    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('checkbox', {
      name: 'Show password',
    }));

    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('checkbox', {
      name: 'Show password',
    }));

    expect(password).toHaveAttribute('type', 'password');
  });

  it('switches to registration and submits account details', async () => {
    renderAccount();

    fireEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    const form = getRegistrationForm();
    const fields = within(form);

    fireEvent.change(
      document.querySelector<HTMLInputElement>(
        'input[autocomplete="name"]',
      )!,
      { target: { value: 'Ragul Kumar' } },
    );

    fireEvent.change(
      document.querySelector<HTMLInputElement>(
        'input[autocomplete="tel"]',
      )!,
      { target: { value: '9876543210' } },
    );

    fireEvent.change(
      document.querySelector<HTMLInputElement>(
        'input[autocomplete="email"]',
      )!,
      { target: { value: 'ragul@example.com' } },
    );

    fireEvent.change(
      document.querySelector<HTMLTextAreaElement>(
        'textarea[autocomplete="street-address"]',
      )!,
      { target: { value: 'Salem, Tamil Nadu' } },
    );

    fireEvent.change(getPasswordInput()!, {
      target: { value: 'password123' },
    });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith({
        name: 'Ragul Kumar',
        phone: '9876543210',
        email: 'ragul@example.com',
        address: 'Salem, Tamil Nadu',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
    });
  });

  it('displays a registration error', async () => {
    mocks.register.mockRejectedValueOnce(
      new Error('Phone number already registered'),
    );

    renderAccount();

    fireEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    const form = getRegistrationForm();

    fireEvent.change(
      document.querySelector<HTMLInputElement>(
        'input[autocomplete="name"]',
      )!,
      { target: { value: 'Ragul Kumar' } },
    );

    fireEvent.change(
      document.querySelector<HTMLInputElement>(
        'input[autocomplete="tel"]',
      )!,
      { target: { value: '9876543210' } },
    );

    fireEvent.change(getPasswordInput()!, {
      target: { value: 'password123' },
    });

    fireEvent.submit(form);

    expect(
      await screen.findByText('Phone number already registered'),
    ).toBeInTheDocument();
  });

  it('renders the logged-in profile and favourites', async () => {
    renderAccount({ loggedIn: true });

    expect(
      screen.getByRole('heading', { name: 'Hello, Ragul' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'My details' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /My favourites/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Kanchipuram Silk Saree'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/me/orders', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  it('saves profile changes', async () => {
    renderAccount({ loggedIn: true });

    fireEvent.change(screen.getByDisplayValue('Ragul Kumar'), {
      target: { value: 'Ragul M' },
    });

    fireEvent.change(
      screen.getByDisplayValue('ragul@example.com'),
      { target: { value: 'new@example.com' } },
    );

    fireEvent.change(
      screen.getByDisplayValue('Salem, Tamil Nadu'),
      { target: { value: 'Chennai, Tamil Nadu' } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        name: 'Ragul M',
        email: 'new@example.com',
        address: 'Chennai, Tamil Nadu',
      });
    });

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });

  it('shows an error when saving profile changes fails', async () => {
    mocks.updateProfile.mockRejectedValueOnce(
      new Error('Profile update failed'),
    );

    renderAccount({ loggedIn: true });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Profile update failed'),
    ).toBeInTheDocument();
  });

  it('calls logout when the user logs out', () => {
    renderAccount({ loggedIn: true });

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it('removes a favourite', () => {
    renderAccount({ loggedIn: true });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove from favourites',
      }),
    );

    expect(mocks.setFavourites).toHaveBeenCalledWith([]);
  });

  it('calls continue shopping when requested', () => {
    const { onContinue } = renderAccount({ loggedIn: true });

    fireEvent.click(
      screen.getByRole('button', { name: /Continue shopping/ }),
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('selects a favourite saree when its image is clicked', () => {
    const { onSelectSaree } = renderAccount({ loggedIn: true });

    fireEvent.click(
      screen.getByRole('img', { name: 'Kanchipuram Silk Saree' }),
    );

    expect(onSelectSaree).toHaveBeenCalledWith(saree);
  });

  it('shows the empty favourites message when there are no favourites', () => {
    renderAccount({ loggedIn: true, favourites: [] });

    expect(
      screen.getByText(
        'No favourites yet. Tap the heart on any saree to save it here.',
      ),
    ).toBeInTheDocument();
  });
});
