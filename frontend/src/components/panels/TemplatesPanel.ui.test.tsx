import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplatesPanel } from './TemplatesPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  target: { width: 1280, height: 720 },
} as unknown as PidioConfig;

describe('TemplatesPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();
  const reloadSpy = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    reloadSpy.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', () => true);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadSpy },
    });
  });

  it('loads and renders template list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        templates: [
          {
            id: '1',
            name: 'My Template',
            description: 'Description',
            modules: ['branding'],
            createdAt: '2026-07-22T00:00:00.000Z',
          },
        ],
      }),
    });

    render(<TemplatesPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    await waitFor(() => {
      expect(screen.getByText('My Template')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/templates'), expect.any(Object));
  });

  it('shows create template form and posts new template', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ templates: [] }),
    });

    render(<TemplatesPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buat Template' }));

    expect(screen.getByText('Buat Template Baru')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g., YouTube Music Video'), {
      target: { value: 'New Template' },
    });
    fireEvent.change(screen.getByPlaceholderText('Deskripsi singkat tentang template ini...'), {
      target: { value: 'New Description' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Template' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/templates'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"New Template"'),
        }),
      );
    });
  });

  it('applies template and reloads window', async () => {
    fetchMock.mockImplementation(url => {
      if (url.includes('/apply')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          templates: [
            { id: '1', name: 'My Template', description: 'Description', modules: [], createdAt: '2026-07-22' },
          ],
        }),
      });
    });

    render(<TemplatesPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    await waitFor(() => {
      expect(screen.getByText('Terapkan')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Terapkan'));

    await waitFor(() => {
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('deletes template after confirmation', async () => {
    let deleteCount = 0;
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'DELETE') {
        deleteCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }
      // GET /api/templates — return list
      return Promise.resolve({
        ok: true,
        json: async () => ({
          templates:
            deleteCount === 0
              ? [
                  {
                    id: '1',
                    name: 'My Template',
                    description: 'Description',
                    modules: [],
                    createdAt: '2026-07-22T00:00:00.000Z',
                  },
                ]
              : [],
        }),
      });
    });

    render(<TemplatesPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    await waitFor(() => {
      expect(screen.getByText('My Template')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hapus'));

    await waitFor(() => {
      expect(screen.getByText('Template berhasil dihapus')).toBeInTheDocument();
    });
    expect(deleteCount).toBe(1);
  });
});
