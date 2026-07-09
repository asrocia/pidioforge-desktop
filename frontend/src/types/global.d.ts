import type { PathKind, PathFilter } from './app.types';

declare global {
  interface Window {
    pidioforge?: {
      pickPath: (options: { kind?: PathKind; title?: string; defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string>;
      revealPath: (targetPath: string) => Promise<{ ok: boolean; error?: string }>;
      notify: (title: string, body: string) => Promise<void>;
      saveFile: (options: { content: string; defaultName?: string }) => Promise<{ ok: boolean; path?: string }>;
      readFile: (filePath?: string) => Promise<{ ok: boolean; content?: string; path?: string }>;
    };
  }
}

export {};
