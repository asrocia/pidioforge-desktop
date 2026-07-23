export type ModuleKey =
  'target' | 'branding' | 'audio' | 'lyrics' | 'spectrum' | 'overlay' | 'queue' | 'loop' | 'templates' | 'help';

export type Job = {
  id: string;
  title: string;
  status: string;
  progress: number;
  speed?: string;
  output?: string;
  outputDir?: string;
  error?: string;
  input?: Record<string, string>;
  startedAt?: string;
  finishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  elapsedSeconds?: number;
  etaSeconds?: number;
  renderedSeconds?: number;
  durationSeconds?: number;
  outputSize?: number;
};

export type PidioConfig = {
  input?: Record<string, unknown>;
  target?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  lyrics?: Record<string, unknown>;
  spectrum?: Record<string, unknown>;
  overlay?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  preview?: Record<string, unknown>;
  loop?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  [key: string]: unknown;
};

export type Preset = { id: string; name: string; config: PidioConfig };
export type Project = { id: string; name: string; config: PidioConfig };
export type AppState = { activeProjectId: string; projects: Project[]; presets: Preset[]; jobs: Job[]; logs: string[] };
export type PathKind = 'file' | 'directory' | 'save';
export type PathFilter = 'media' | 'visual' | 'video' | 'audio' | 'image' | 'lyrics' | 'lut';

export type PathInfo = {
  ok?: boolean;
  exists?: boolean;
  empty?: boolean;
  path?: string;
  name?: string;
  dir?: string;
  type?: string;
  expectedOk?: boolean;
  warning?: string;
  size?: number;
  isFile?: boolean;
  isDirectory?: boolean;
  parentExists?: boolean;
};
