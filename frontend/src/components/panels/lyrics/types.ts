import type { PidioConfig } from '../../../types/app.types';

export type LyricLine = { time?: number; text?: string };

export type LyricsValidation = {
  ok?: boolean;
  warnings?: string[];
  lineCount?: number;
  beats?: unknown[];
  quality?: { score?: number; warnings?: string[]; metrics?: { beats?: number; lines?: number } };
};

export interface LyricsCardProps {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface LyricsEngineState {
  text: string;
  parsed: LyricLine[];
  srt: string;
  lrc: string;
  vtt: string;
  message: string;
  validation: LyricsValidation | null;
  busy: boolean;
  setText: (v: string) => void;
  applyLyricPreset: (v: string) => void;
  parseLyrics: () => Promise<void>;
  autoAlign: () => Promise<void>;
  validateLyrics: () => Promise<void>;
  exportLyrics: (format: string) => Promise<void>;
  setParsed: (v: LyricLine[]) => void;
  setMessage: (v: string) => void;
  setBusy: (v: boolean) => void;
  setValidation: (v: LyricsValidation | null) => void;
  setSrt: (v: string) => void;
  setLrc: (v: string) => void;
  setVtt: (v: string) => void;
}
