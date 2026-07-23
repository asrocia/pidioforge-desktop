import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewControlsPanel } from './PreviewControlsPanel';
import { PreviewTimelineControls } from './PreviewTimelineControls';
import { PreviewLayerSourcePanel } from './PreviewLayerSourcePanel';
import type { LiveTarget } from '../../types/preview.types';

describe('PreviewControlsPanel', () => {
  const baseProps = {
    quality: 'draft',
    onQualityChange: vi.fn(),
    safePreset: 'youtube',
    onSafePresetChange: vi.fn(),
    zoom: '100',
    onZoomChange: vi.fn(),
    showModeToggle: false,
    previewMode: 'live' as const,
    onToggleMode: vi.fn(),
  };

  it('renders quality, safe area, zoom selects', () => {
    render(<PreviewControlsPanel {...baseProps} />);
    expect(screen.getByText('Mutu')).toBeInTheDocument();
    expect(screen.getByText('Area Aman')).toBeInTheDocument();
    expect(screen.getByText('Zoom')).toBeInTheDocument();
  });

  it('calls onQualityChange when quality select changes', () => {
    const onQualityChange = vi.fn();
    render(<PreviewControlsPanel {...baseProps} onQualityChange={onQualityChange} />);
    fireEvent.change(screen.getByDisplayValue('Draf'), { target: { value: 'high' } });
    expect(onQualityChange).toHaveBeenCalledWith('high');
  });

  it('shows mode toggle button when showModeToggle is true', () => {
    render(<PreviewControlsPanel {...baseProps} showModeToggle={true} />);
    expect(screen.getByText('🎬 Tampilkan Hasil Render')).toBeInTheDocument();
  });

  it('hides mode toggle button when showModeToggle is false', () => {
    render(<PreviewControlsPanel {...baseProps} showModeToggle={false} />);
    expect(screen.queryByText(/Tampilkan/)).not.toBeInTheDocument();
  });

  it('calls onToggleMode when toggle button clicked', () => {
    const onToggleMode = vi.fn();
    render(<PreviewControlsPanel {...baseProps} showModeToggle={true} onToggleMode={onToggleMode} />);
    fireEvent.click(screen.getByText('🎬 Tampilkan Hasil Render'));
    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });
});

describe('PreviewTimelineControls', () => {
  const baseProps = {
    startAt: 0,
    duration: 4,
    onStartAtChange: vi.fn(),
    onDurationChange: vi.fn(),
  };

  it('renders start and duration inputs', () => {
    render(<PreviewTimelineControls {...baseProps} />);
    expect(screen.getByText('Mulai')).toBeInTheDocument();
    expect(screen.getByText('Durasi')).toBeInTheDocument();
  });

  it('renders quick jump buttons', () => {
    render(<PreviewTimelineControls {...baseProps} />);
    expect(screen.getByRole('button', { name: '0s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '-5s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+5s' })).toBeInTheDocument();
  });

  it('calls onStartAtChange when jump button clicked', () => {
    const onStartAtChange = vi.fn();
    render(<PreviewTimelineControls {...baseProps} onStartAtChange={onStartAtChange} />);
    fireEvent.click(screen.getByRole('button', { name: '30s' }));
    expect(onStartAtChange).toHaveBeenCalledWith(30);
  });

  it('calls onStartAtChange with clamped value for -5s', () => {
    const onStartAtChange = vi.fn();
    render(<PreviewTimelineControls {...baseProps} startAt={3} onStartAtChange={onStartAtChange} />);
    fireEvent.click(screen.getByRole('button', { name: '-5s' }));
    expect(onStartAtChange).toHaveBeenCalledWith(0);
  });
});

describe('PreviewLayerSourcePanel', () => {
  const layers = [
    { id: 'spectrum' as LiveTarget, label: 'Spectrum', enabled: true, primary: true },
    { id: 'logo' as LiveTarget, label: 'Logo', enabled: true },
    { id: 'watermark' as LiveTarget, label: 'Watermark', enabled: false },
  ];

  const baseProps = {
    liveLayers: layers,
    selectedLive: '' as LiveTarget | '',
    lockedLayers: new Set<LiveTarget>(),
    onToggleLayerVisibility: vi.fn(),
    onSelectLive: vi.fn(),
    onCenterLiveLayer: vi.fn(),
    onToggleLayerLock: vi.fn(),
    onResetSelectedLayer: vi.fn(),
    canResetSelectedLayer: false,
    showSafeArea: true,
    showGrid: false,
    onToggleSafeArea: vi.fn(),
    onToggleGrid: vi.fn(),
    contextPanel: <div data-testid="context-panel" />,
  };

  it('renders all layer labels', () => {
    render(<PreviewLayerSourcePanel {...baseProps} />);
    expect(screen.getByText('Spectrum')).toBeInTheDocument();
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Watermark')).toBeInTheDocument();
  });

  it('shows SHOW for enabled layers and HIDE for disabled', () => {
    render(<PreviewLayerSourcePanel {...baseProps} />);
    const showButtons = screen.getAllByText('SHOW');
    const hideButtons = screen.getAllByText('HIDE');
    expect(showButtons).toHaveLength(2);
    expect(hideButtons).toHaveLength(1);
  });

  it('calls onToggleLayerVisibility when show/hide clicked', () => {
    const onToggleLayerVisibility = vi.fn();
    render(<PreviewLayerSourcePanel {...baseProps} onToggleLayerVisibility={onToggleLayerVisibility} />);
    const hideButton = screen.getByText('HIDE');
    fireEvent.click(hideButton);
    expect(onToggleLayerVisibility).toHaveBeenCalledWith('watermark');
  });

  it('renders context panel slot', () => {
    render(<PreviewLayerSourcePanel {...baseProps} />);
    expect(screen.getByTestId('context-panel')).toBeInTheDocument();
  });

  it('shows Safe Aktif label when showSafeArea true', () => {
    render(<PreviewLayerSourcePanel {...baseProps} showSafeArea={true} />);
    expect(screen.getByText('Safe Aktif')).toBeInTheDocument();
  });

  it('shows Grid Mati label when showGrid false', () => {
    render(<PreviewLayerSourcePanel {...baseProps} showGrid={false} />);
    expect(screen.getByText('Grid Mati')).toBeInTheDocument();
  });
});
