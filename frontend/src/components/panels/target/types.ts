import type { PidioConfig } from '../../../types/app.types';

export type MediaFile = {
  path: string;
  name: string;
  size: number;
  type: string;
  modifiedAt?: string;
  health?: { level?: string };
  duration?: number;
  warnings?: string[];
};
export type MediaPair = {
  title: string;
  visual: string;
  audio: string;
  lyrics?: string;
  index?: number;
  outputName?: string;
  confidence?: number;
  pairReason?: string;
  lyricConfidence?: number;
  lyricReason?: string;
};
export type CollisionItem = { status?: string; requested?: string; finalPath?: string };
export type TargetSummary = {
  ready?: boolean;
  errors?: string[];
  warnings?: string[];
  counts?: { videos?: number; images?: number; audios?: number; lyrics?: number; total?: number };
  risk?: {
    score?: number;
    lowConfidencePairs?: number;
    collisionCount?: number;
    invalidFiles?: number;
    noLyrics?: number;
  };
  collisions?: CollisionItem[];
  resolution?: string;
  estimate?: {
    jobs?: number;
    estimatedSizeMB?: number;
    estimatedTotalDuration?: number;
    resolution?: string;
    bitrate?: string;
    encoder?: string;
  };
};
export type TargetDiagnostics = {
  ffmpeg?: boolean;
  ffprobe?: boolean;
  recommended?: string;
  encoders?: Record<string, boolean>;
};

export type TargetScan = {
  files: MediaFile[];
  pairs: MediaPair[];
  summary?: TargetSummary;
  diagnostics?: TargetDiagnostics;
};

export interface TargetCardProps {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export interface TargetEngineState {
  scan: TargetScan;
  busy: boolean;
  message: string;
  selectedType: string;
  setSelectedType: (v: string) => void;
  advanced: boolean;
  setAdvanced: (v: boolean) => void;
  batchOpen: boolean;
  setBatchOpen: (v: boolean) => void;
  files: MediaFile[];
  est: TargetSummary['estimate'];
  counts: NonNullable<TargetSummary['counts']>;
  risk: TargetSummary['risk'];
  collisions: CollisionItem[];
  enc: Record<string, boolean>;
  hasVisual: boolean;
  hasAudio: boolean;
  targetFormat: 'landscape' | 'vertical' | 'square';
  workflowSteps: Array<{ id: string; label: string; completed?: boolean }>;
  activeWorkflowIndex: number;
  inspectTarget: () => Promise<void>;
  createBatch: () => Promise<void>;
  createStructure: () => Promise<void>;
  autoTuneTarget: () => Promise<void>;
  checkDiagnosticsOnly: () => Promise<void>;
}
