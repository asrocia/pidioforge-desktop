import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateBanner } from './UpdateBanner';

describe('UpdateBanner', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'pidioforge', { writable: true, value: undefined });
  });

  it('shows unavailable error in browser mode', async () => {
    render(<UpdateBanner />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Update gagal: Updater tidak tersedia di mode browser');
    });
  });

  it('shows available update and calls download', async () => {
    const downloadUpdate = vi.fn().mockResolvedValue(undefined);
    const checkUpdate = vi.fn().mockResolvedValue({ ok: true });
    const onUpdateStatus = vi.fn((cb: (info: { status: string; version?: string }) => void) => {
      cb({ status: 'available', version: '1.2.3' });
      return () => {};
    });
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: {
        onUpdateStatus,
        checkUpdate,
        downloadUpdate,
        installUpdate: vi.fn(),
      },
    });

    render(<UpdateBanner />);
    await waitFor(() => expect(screen.getByText('Update 1.2.3 tersedia')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloadUpdate).toHaveBeenCalledTimes(1);
  });
});
