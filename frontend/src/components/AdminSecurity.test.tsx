
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminSecurity } from './AdminSecurity';

const { mockFetch, mockToDataURL } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockToDataURL: vi.fn(),
}));

vi.mock('qrcode', () => ({
  toDataURL: mockToDataURL,
}));

const jsonResponse = (data: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  }) as unknown as Response;

describe('AdminSecurity', () => {
  let statusEnabled: boolean;
  let backupLeft: number;
  const onChange = vi.fn();
  const onExpired = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    statusEnabled = false;
    backupLeft = 8;

    mockToDataURL.mockResolvedValue('data:image/png;base64,test-qr');

    mockFetch.mockImplementation(
      async (url: string, options?: RequestInit) => {
        const method = options?.method ?? 'GET';

        if (url === '/api/admin/2fa/status') {
          return jsonResponse({
            enabled: statusEnabled,
            backupLeft,
          });
        }

        if (url === '/api/admin/2fa/setup' && method === 'POST') {
          return jsonResponse({
            secret: 'TESTSECRET123',
            uri: 'otpauth://totp/Test?secret=TESTSECRET123',
          });
        }

        if (url === '/api/admin/2fa/enable' && method === 'POST') {
          statusEnabled = true;
          backupLeft = 8;

          return jsonResponse({
            backupCodes: ['BACKUP-111', 'BACKUP-222'],
          });
        }

        if (url === '/api/admin/2fa/disable' && method === 'POST') {
          statusEnabled = false;
          return jsonResponse({});
        }

        return jsonResponse({ error: 'Unexpected request' }, 404);
      },
    );

    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows loading while the status request is pending', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));

    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('loads the disabled status and reports it to the parent', async () => {
    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    expect(await screen.findByText('Off')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /turn on 2-step login/i }),
    ).toBeTruthy();

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/2fa/status',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
  });

  it('notifies the parent when the session has expired', async () => {
    mockFetch.mockImplementationOnce(async () =>
      jsonResponse({ error: 'Unauthorized' }, 401),
    );

    render(
      <AdminSecurity
        token="expired-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    await waitFor(() => {
      expect(onExpired).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('starts setup and displays the QR code and secret', async () => {
    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    );

    expect(await screen.findByAltText('QR code')).toBeTruthy();
    expect(screen.getByText('TESTSECRET123')).toBeTruthy();

    expect(mockToDataURL).toHaveBeenCalledWith(
      'otpauth://totp/Test?secret=TESTSECRET123',
      { width: 220, margin: 1 },
    );

    expect(
      screen.getByRole('button', { name: /confirm and turn on/i }),
    ).toBeDisabled();
  });

  it('shows an error when setup fails', async () => {
    mockFetch.mockImplementation(
      async (url: string, options?: RequestInit) => {
        if (url === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: false, backupLeft: 0 });
        }

        if (url === '/api/admin/2fa/setup' && options?.method === 'POST') {
          return jsonResponse({ error: 'Setup failed' }, 500);
        }

        return jsonResponse({});
      },
    );

    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    );

    expect(await screen.findByText('Setup failed')).toBeTruthy();
  });

  it('enables 2FA and displays backup codes', async () => {
    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    );

    const codeInput = await screen.findByPlaceholderText('123456');

    fireEvent.change(codeInput, { target: { value: '123456' } });

    fireEvent.click(
      screen.getByRole('button', { name: /confirm and turn on/i }),
    );

    expect(
      await screen.findByText(/save your backup codes now/i),
    ).toBeTruthy();

    expect(screen.getByText('BACKUP-111')).toBeTruthy();
    expect(screen.getByText('BACKUP-222')).toBeTruthy();
    expect(await screen.findByText('On')).toBeTruthy();

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(true);
    });

    const enableCall = mockFetch.mock.calls.find(
      ([url, options]) =>
        url === '/api/admin/2fa/enable' &&
        options?.method === 'POST',
    );

    expect(enableCall).toBeTruthy();
    expect(JSON.parse(enableCall![1].body as string)).toEqual({
      code: '123456',
    });
  });

  it('shows an error when enabling 2FA fails', async () => {
    mockFetch.mockImplementation(
      async (url: string, options?: RequestInit) => {
        if (url === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: false, backupLeft: 0 });
        }

        if (url === '/api/admin/2fa/setup') {
          return jsonResponse({
            secret: 'TESTSECRET123',
            uri: 'otpauth://totp/Test?secret=TESTSECRET123',
          });
        }

        if (url === '/api/admin/2fa/enable' && options?.method === 'POST') {
          return jsonResponse({ error: 'Invalid verification code' }, 400);
        }

        return jsonResponse({});
      },
    );

    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    );

    fireEvent.change(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /confirm and turn on/i }),
    );

    expect(
      await screen.findByText('Invalid verification code'),
    ).toBeTruthy();
  });

  it('allows the admin to cancel setup', async () => {
    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    );

    expect(await screen.findByAltText('QR code')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    ).toBeTruthy();

    expect(screen.queryByAltText('QR code')).toBeNull();
  });

  it('disables 2FA after password and code are provided', async () => {
    statusEnabled = true;

    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    expect(await screen.findByText('Backup codes left:')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: /turn off 2-step login/i }),
    );

    fireEvent.change(screen.getByPlaceholderText('Admin password'), {
      target: { value: 'admin-password' },
    });

    fireEvent.change(screen.getByPlaceholderText('Code'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^turn off$/i }));

    expect(await screen.findByText('Off')).toBeTruthy();

    const disableCall = mockFetch.mock.calls.find(
      ([url, options]) =>
        url === '/api/admin/2fa/disable' &&
        options?.method === 'POST',
    );

    expect(disableCall).toBeTruthy();
    expect(JSON.parse(disableCall![1].body as string)).toEqual({
      password: 'admin-password',
      code: '123456',
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows an error when disabling 2FA fails', async () => {
    statusEnabled = true;

    mockFetch.mockImplementation(
      async (url: string, options?: RequestInit) => {
        if (url === '/api/admin/2fa/status') {
          return jsonResponse({ enabled: true, backupLeft: 8 });
        }

        if (url === '/api/admin/2fa/disable' && options?.method === 'POST') {
          return jsonResponse({ error: 'Incorrect password or code' }, 400);
        }

        return jsonResponse({});
      },
    );

    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn off 2-step login/i,
      }),
    );

    fireEvent.change(screen.getByPlaceholderText('Admin password'), {
      target: { value: 'wrong-password' },
    });

    fireEvent.change(screen.getByPlaceholderText('Code'), {
      target: { value: '000000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^turn off$/i }));

    expect(
      await screen.findByText('Incorrect password or code'),
    ).toBeTruthy();
  });

  it('hides backup codes after the admin confirms they saved them', async () => {
    render(
      <AdminSecurity
        token="test-token"
        onChange={onChange}
        onExpired={onExpired}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /turn on 2-step login/i,
      }),
    );

    fireEvent.change(await screen.findByPlaceholderText('123456'), {
      target: { value: '123456' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /confirm and turn on/i }),
    );

    expect(await screen.findByText('BACKUP-111')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: /i have saved them/i }),
    );

    expect(screen.queryByText('BACKUP-111')).toBeNull();
    expect(screen.queryByText('BACKUP-222')).toBeNull();
  });
});
