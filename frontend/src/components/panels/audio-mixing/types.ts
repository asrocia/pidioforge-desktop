import type { PidioConfig } from '../../../types/app.types';
import type { Stem } from '../../../lib/stem-utils';

export type AudioAnalysis = {
  ok?: boolean;
  warnings?: string[];
  waveform?: { peaks?: number[] };
  loudness?: { integratedLufs?: number; truePeak?: number };
  beats?: unknown[];
  info?: { duration?: number };
  totalDuration?: number;
};

export interface AudioMixingCardProps {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface StemDragState {
  stemDraggedIdx: number | null;
  stemDragOverIdx: number | null;
  handleStemDragStart: (e: React.DragEvent, index: number) => void;
  handleStemDragOver: (e: React.DragEvent, index: number) => void;
  handleStemDragLeave: () => void;
  handleStemDrop: (e: React.DragEvent, targetIndex: number) => void;
  handleStemDragEnd: () => void;
}

export interface AudioAnalysisState {
  analysis: AudioAnalysis | null;
  validation: AudioAnalysis | null;
  message: string;
  busy: boolean;
  validateAudio: () => Promise<void>;
  analyzeAudio: () => Promise<void>;
}

export interface AudioPreviewState {
  previewUrl: string;
  previewing: boolean;
  previewAudio: () => Promise<void>;
}

export interface StemManagementState {
  stems: Stem[];
  introText: string;
  slotText: string;
  stemsText: string;
  stemMessage: string;
  setIntroText: (value: string) => void;
  setSlotText: (value: string) => void;
  setStemsText: (value: string) => void;
  setStemMessage: (value: string) => void;
  commitIntro: () => void;
  commitSlots: () => void;
  commitStems: () => void;
  applyPreset: (v: string) => void;
  toggleStemSolo: (index: number) => void;
  toggleStemMute: (index: number) => void;
  updateStemVolume: (index: number, volume: number) => void;
  addEmptyStem: () => void;
  addMultiStems: () => Promise<void>;
  removeStem: (index: number) => void;
}
