import type { PathKind } from './app.types';

export type UpdateStatus = 'checking' | 'available' | 'up-to-date' | 'downloading' | 'ready' | 'error';

export interface UpdateStatusInfo {
  status: UpdateStatus;
  version?: string;
  releaseDate?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  error?: string;
}

declare global {
  interface Window {
    pidioforge?: {
      pickPath: (options: { kind?: PathKind; title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string>;
      revealPath: (targetPath: string) => Promise<{ ok: boolean; error?: string }>;
      notify: (title: string, body: string) => Promise<void>;
      saveFile: (options: { content: string; defaultName?: string }) => Promise<{ ok: boolean; path?: string }>;
      readFile: (filePath?: string) => Promise<{ ok: boolean; content?: string; path?: string }>;
      checkUpdate: () => Promise<{ ok: boolean; version?: string; error?: string }>;
      downloadUpdate: () => Promise<{ ok: boolean; error?: string }>;
      installUpdate: () => Promise<void>;
      onUpdateStatus: (callback: (info: UpdateStatusInfo) => void) => () => void;
    };
  }
}

export {};
