import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioMixingPanel } from './audio-mixing/AudioMixingPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG: PidioConfig = {
  audio: {
    stems: [
      { name: 'vocals', file: 'C:/vocals.wav', volume: 100, pan: 0, solo: false, mute: false },
      { name: 'drums', file: 'C:/drums.wav', volume: 80, pan: 0, solo: false, mute: false },
    ],
    introSongs: [],
    songs: [],
  },
};

describe('AudioMixingPanel UI', () => {
  const updateConfig = vi.fn();
  const alertSpy = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    alertSpy.mockReset();
    vi.stubGlobal('alert', alertSpy);
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: {
        pickPaths: vi.fn(),
        pickPath: vi.fn(),
      },
    });
  });

  it('renders Stem Mixer with existing stems', () => {
    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Stem Mixer')).toBeInTheDocument();
    expect(screen.getByText('vocals')).toBeInTheDocument();
    expect(screen.getByText('drums')).toBeInTheDocument();
    expect(screen.getByText('C:/vocals.wav')).toBeInTheDocument();
  });

  it('Add Stem button appends empty stem', () => {
    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Add Stem' }));

    expect(updateConfig).toHaveBeenCalledWith(
      'audio.stems',
      expect.arrayContaining([expect.objectContaining({ name: 'track', file: '', volume: 100, pan: 0 })]),
    );
  });

  it('Multi Files shows alert when desktop bridge unavailable', async () => {
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: undefined,
    });

    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Multi Files' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Multi-select hanya tersedia di aplikasi desktop. Jalankan PidioForge Desktop.',
    );
  });

  it('Multi Files appends only unique stems', async () => {
    const pickPaths = vi.fn().mockResolvedValue(['C:/bass.wav', 'C:/vocals.wav']);
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: { pickPaths, pickPath: vi.fn() },
    });

    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Multi Files' }));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith(
        'audio.stems',
        expect.arrayContaining([expect.objectContaining({ file: 'C:/bass.wav', name: 'bass' })]),
      );
    });
  });

  it('Multi Files shows duplicate skipped message', async () => {
    const pickPaths = vi.fn().mockResolvedValue(['C:/bass.wav', 'C:/vocals.wav']);
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: { pickPaths, pickPath: vi.fn() },
    });

    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Multi Files' }));

    await waitFor(() => {
      expect(screen.getByText('1 file duplikat dilewati.')).toBeInTheDocument();
    });
  });

  it('Multi Files shows all duplicate message when nothing added', async () => {
    const pickPaths = vi.fn().mockResolvedValue(['C:/vocals.wav', 'C:/drums.wav']);
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: { pickPaths, pickPath: vi.fn() },
    });

    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Multi Files' }));

    await waitFor(() => {
      expect(screen.getByText('Semua file terpilih sudah ada di stem mixer.')).toBeInTheDocument();
    });
    expect(updateConfig).not.toHaveBeenCalledWith('audio.stems', expect.anything());
  });

  it('Solo button toggles solo on selected stem', () => {
    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    const soloButtons = screen.getAllByTitle('Solo');
    fireEvent.click(soloButtons[0]);

    expect(updateConfig).toHaveBeenCalledWith(
      'audio.stems',
      expect.arrayContaining([expect.objectContaining({ solo: true })]),
    );
  });

  it('Mute button toggles mute on selected stem', () => {
    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    const muteButtons = screen.getAllByTitle('Mute');
    fireEvent.click(muteButtons[1]);

    expect(updateConfig).toHaveBeenCalledWith(
      'audio.stems',
      expect.arrayContaining([expect.objectContaining({ mute: true })]),
    );
  });

  it('remove button removes selected stem', () => {
    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    const removeButtons = screen.getAllByTitle('Remove');
    fireEvent.click(removeButtons[0]);

    expect(updateConfig).toHaveBeenCalledWith('audio.stems', [expect.objectContaining({ name: 'drums' })]);
  });

  it('advanced text editor is rendered', () => {
    render(<AudioMixingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Advanced: Text Editor')).toBeInTheDocument();
  });

  it('shows empty state when no stems exist', () => {
    render(
      <AudioMixingPanel config={{ audio: { stems: [], introSongs: [], songs: [] } }} updateConfig={updateConfig} />,
    );

    expect(screen.getByText('No stems added. Click "+ Add Stem" to start.')).toBeInTheDocument();
  });
});
