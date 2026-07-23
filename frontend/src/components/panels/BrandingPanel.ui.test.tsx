import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandingPanel } from './BrandingPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  branding: {
    logoEnabled: true,
    ctaEnabled: false,
    brandPreset: 'custom',
    safeAreaPreset: 'youtube',
  },
} as unknown as PidioConfig;

describe('BrandingPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders core branding sections', () => {
    render(<BrandingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Bumper Video')).toBeInTheDocument();
    expect(screen.getByText('Logo Overlay')).toBeInTheDocument();
    expect(screen.getByText('CTA Greenscreen')).toBeInTheDocument();
    expect(screen.getByText('Brand Color Palette')).toBeInTheDocument();
    expect(screen.getByText('Branding Templates')).toBeInTheDocument();
  });

  it('branding preset applies expected config updates', () => {
    render(<BrandingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    const presetSelect = screen.getByDisplayValue('Branding Kustom');
    fireEvent.change(presetSelect, { target: { value: 'logo-only' } });

    expect(updateConfig).toHaveBeenCalledWith('branding.brandPreset', 'logo-only');
    expect(updateConfig).toHaveBeenCalledWith('branding.logoEnabled', true);
    expect(updateConfig).toHaveBeenCalledWith('branding.logoScale', 18);
  });

  it('validate assets posts request and shows ready message', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, warnings: [] }),
    });

    render(<BrandingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Validasi Aset' }));

    await waitFor(() => {
      expect(screen.getByText('Aset branding siap.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/branding/validate'), expect.any(Object));
  });

  it('theme buttons update brand colors', () => {
    render(<BrandingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Blue Theme' }));

    expect(updateConfig).toHaveBeenCalledWith('branding.brandColors.primary', '#3b82f6');
    expect(updateConfig).toHaveBeenCalledWith('branding.brandColors.secondary', '#8b5cf6');
    expect(updateConfig).toHaveBeenCalledWith('branding.brandColors.accent', '#f59e0b');
  });
});
