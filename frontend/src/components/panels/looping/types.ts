import type { PidioConfig } from '../../../types/app.types';

export type LoopJob = {
  id?: string;
  status?: string;
  progress?: number;
  elapsedSeconds?: number;
  etaSeconds?: number;
  renderedSeconds?: number;
  error?: string;
};

export type LoopResult = {
  ok?: boolean;
  url?: string;
  output: string;
  duration?: number;
  inputDuration?: number;
  size?: number;
};

export type SeamPreview = {
  url?: string;
  quality?: { score?: number; label?: string };
};

export type LoopAnalysisBest = { score?: number; label?: string; trimStart?: number; trimEnd?: number };

export type LoopAnalysis = {
  best?: LoopAnalysisBest;
  metrics?: {
    motionContinuity?: number;
    colorConsistency?: number;
    sceneStability?: number;
    temporalSmoothness?: number;
  };
  suggestions?: string[];
  warnings?: string[];
};

export type LoopValidation = {
  ok?: boolean;
  errors?: string[];
  warnings?: string[];
  inputDuration?: number;
  loopsNeeded?: number;
  disk?: { ok?: boolean; freeGB?: number };
};

export type BatchResult = {
  created?: unknown[];
  skipped?: Array<{ input: string; error: string }>;
  outputDir?: string;
  scanned?: number;
  limited?: boolean;
};

export interface LoopingCardProps {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface LoopingEngineState {
  input: string;
  setInput: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  output: string;
  setOutput: (value: string) => void;
  mode: string;
  setMode: (value: string) => void;
  loopStyle: string;
  setLoopStyle: (value: string) => void;
  crossfade: number;
  setCrossfade: (value: number) => void;
  trimStart: number;
  setTrimStart: (value: number) => void;
  trimEnd: number;
  setTrimEnd: (value: number) => void;
  muteAudio: boolean;
  setMuteAudio: (value: boolean) => void;
  audioFade: boolean;
  setAudioFade: (value: boolean) => void;
  preset: string;
  setPreset: (value: string) => void;
  batchText: string;
  setBatchText: (value: string) => void;
  batchOutput: string;
  setBatchOutput: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  busy: boolean;
  setBusy: (value: boolean) => void;
  result: LoopResult | null;
  setResult: (value: LoopResult | null) => void;
  seamPreview: SeamPreview | null;
  setSeamPreview: (value: SeamPreview | null) => void;
  batchResult: BatchResult | null;
  setBatchResult: (value: BatchResult | null) => void;
  analysis: LoopAnalysis | null;
  setAnalysis: (value: LoopAnalysis | null) => void;
  batchProgress: { done: number; total: number };
  setBatchProgress: (value: { done: number; total: number }) => void;
  loopJob: LoopJob | null;
  setLoopJob: (value: LoopJob | null) => void;
  validation: LoopValidation | null;
  setValidation: (value: LoopValidation | null) => void;
  loopPayload: {
    input: string;
    duration: number;
    output: string;
    mode: string;
    loopStyle: string;
    crossfade: number;
    trimStart: number;
    trimEnd: number;
    muteAudio: boolean;
    audioFade: boolean;
    preset: string;
  };
  resultUrl: string;
  seamUrl: string;
}
