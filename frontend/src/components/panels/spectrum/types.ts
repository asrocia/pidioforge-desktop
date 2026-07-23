import type { MouseEvent } from 'react';
import type { PidioConfig } from '../../../types/app.types';

export type SpectrumPreview = {
  ok?: boolean;
  tuned?: { sensitivity?: number; height?: number; dynamicRange?: number; Sensitivitas?: number; warnings?: string[] };
  waveform?: { peaks?: number[] };
  beats?: unknown[];
  nowPlaying?: { text?: string };
  recommendedPatch?: { spectrum?: Record<string, unknown> };
};

export interface SpectrumCardProps {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface SpectrumEngineState {
  preview: SpectrumPreview | null;
  message: string;
  busy: boolean;
  dragging: 'nowPlaying' | 'spectrum' | '';
  setDragging: (v: 'nowPlaying' | 'spectrum' | '') => void;
  tuned: SpectrumPreview['tuned'];
  peaks: number[];
  format: string;
  visual: string;
  visualType: string;
  npX: number;
  npY: number;
  spY: number;
  spectrumheight: number;
  spectrumPreviewheight: number;
  galleryEnabled: boolean;
  galleryImages: string[];
  galleryActiveIndex: number;
  setGalleryImages: (images: string[]) => void;
  setGalleryActiveIndex: (index: number) => void;
  applyPreset: (v: string) => void;
  loadPreview: () => Promise<void>;
  analyzeAndTune: () => Promise<void>;
  commitColors: () => void;
  setDragPosition: (e: MouseEvent<HTMLDivElement>, target?: 'nowPlaying' | 'spectrum' | '') => void;
  editNowPlaying: (text: string) => void;
}
