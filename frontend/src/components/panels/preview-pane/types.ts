import type { PidioConfig, Job, ModuleKey } from '../../../types/app.types';
import type { LiveTarget } from '../../../types/preview.types';

export type PreviewData = {
  url?: string;
  resolution?: string;
  size?: number;
  elapsedMs?: number;
  startAt?: number;
  duration?: number;
  logs?: string[];
  warnings?: string[];
  diagnostics?: { warnings?: string[]; safeArea?: unknown };
  safeArea?: { top: number; right: number; bottom: number; left: number };
  snapshot?: { url?: string; output?: string; size?: number };
};

export interface PreviewPaneProps {
  active: ModuleKey;
  jobs: Job[];
  logs: string[];
  refresh: () => void;
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export type { LiveTarget };
