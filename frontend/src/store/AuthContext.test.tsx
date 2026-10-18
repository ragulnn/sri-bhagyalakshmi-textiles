
import React from 'react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const customer = {
  id: 'customer-1',
  name: 'Test Customer',
  phone: '9876543210',
  email: 'customer@example.com',
  address: 'Salem, Tamil Nadu',
  favourites: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function AuthConsumer() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="ready">{String(auth.ready)}</span>
      <span data-testid="user">{auth.user?.name ?? 'signed out'}</span>
      <span data-testid="token">{auth.getToken()}</span>
      <span data-testid="favourites">
        {auth.user?.favourites.join(',') ?? ''}
      </span>

      <button
        onClick={() =>
          auth.login('9876543210', 'password123')
        }
      >
        Login
      </button>

      <button
        onClick={() =>
          auth.register({
            name: 'New Customer',
            phone: '9876543210',
            email: 'new@example.com',
            address: 'Salem',
            password: 'password123',
          })
        }
      >
        Register
      </button>

      <button onClick={() => auth.logout()}>Logout</button>

      <button
        onClick={() =>
          auth.updateProfile({
            name: 'Updated Customer',
            email: 'updated@example.com',
            address: 'Chennai',
          })
        }
      >
        Update profile
      </button>

      <button
        onClick={() => auth.setFavourites(['saree-1', 'saree-2'])}
      >
        Set favourites
      </button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('becomes ready when no saved token exists', async () => {
    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('ready').textContent).toBe('true');
    });

    expect(screen.getByTestId('user').textContent).toBe('signed out');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('logs in and stores the token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'test-token', user: customer }),
    } as Response);

    renderAuth();

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test Customer');
    });

    expect(localStorage.getItem('sbt_user_token')).toBe('test-token');
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          phone: '9876543210',
          password: 'password123',
        }),
      }),
    );
  });

  it('registers a new customer', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'register-token', user: customer }),
    } as Response);

    renderAuth();

    await act(async () => {
      screen.getByRole('button', { name: 'Register' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test Customer');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(localStorage.getItem('sbt_user_token')).toBe('register-token');
  });

  it('logs out and clears the saved token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'test-token', user: customer }),
    } as Response);

    renderAuth();

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test Customer');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    expect(screen.getByTestId('user').textContent).toBe('signed out');
    expect(localStorage.getItem('sbt_user_token')).toBeNull();
  });

  it('restores the session from a saved token', async () => {
    localStorage.setItem('sbt_user_token', 'saved-token');

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: customer }),
    } as Response);

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test Customer');
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer saved-token' },
      }),
    );
  });

  it('updates the customer profile', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token', user: customer }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { ...customer, name: 'Updated Customer' },
        }),
      } as Response);

    renderAuth();

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test Customer');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Update profile' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Updated Customer');
    });
  });

  it('updates favourites optimistically', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'test-token', user: customer }),
    } as Response);

    renderAuth();

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test Customer');
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await act(async () => {
      screen.getByRole('button', { name: 'Set favourites' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('favourites').textContent).toBe(
        'saree-1,saree-2',
      );
    });
  });

  it('rejects useAuth when rendered outside the provider', () => {
    function InvalidConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useAuth must be used inside AuthProvider',
    );
  });
});
