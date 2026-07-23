import type { ModuleKey } from '../../types/app.types';

const svgClass = 'w-full h-full';

export function ModuleIcon({ kind }: { kind: ModuleKey }) {
  switch (kind) {
    case 'target':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4v10h16V8H4Zm1-3 2.5 2H10l-2.5-2H6Zm4.5 0 2.5 2h2.5l-2.5-2h-2.5Zm5 0 2.5 2H20v-1a1 1 0 0 0-1-1h-3.5Z" />
        </svg>
      );
    case 'branding':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Zm-1 14.5-3.5-3.5 1.41-1.41L11 13.67l5.09-5.09L17.5 10 11 16.5Z" />
        </svg>
      );
    case 'audio':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2H5v-2a7 7 0 1 1 14 0v2h-2c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9Z" />
        </svg>
      );
    case 'lyrics':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M14 3v9.28a4.51 4.51 0 0 0-2-.28C9.79 12 8 13.34 8 15s1.79 3 4 3 4-1.34 4-3V7h4V3h-6Z" />
          <rect x="3" y="4" width="7" height="2" rx="1" />
          <rect x="3" y="8" width="5" height="2" rx="1" />
        </svg>
      );
    case 'spectrum':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <rect x="4" y="11" width="3" height="8" rx="1.5" />
          <rect x="8.5" y="7" width="3" height="12" rx="1.5" />
          <rect x="13" y="4" width="3" height="15" rx="1.5" />
          <rect x="17.5" y="9" width="3" height="10" rx="1.5" />
        </svg>
      );
    case 'overlay':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M12 2 2 7l10 5 10-5-10-5Z" />
          <path d="m2 12 10 5 10-5" opacity="0.7" />
          <path d="m2 17 10 5 10-5" opacity="0.4" />
        </svg>
      );
    case 'queue':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M3 5h12v2H3V5Zm0 4h12v2H3V9Zm0 4h8v2H3v-2Zm10 0v6l5-3-5-3Z" />
        </svg>
      );
    case 'loop':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M12 12c-1.77-2.34-3.6-4-5.5-4C4.01 8 2 10.01 2 12.5S4.01 17 6.5 17c1.9 0 3.73-1.66 5.5-4Zm0 0c1.77 2.34 3.6 4 5.5 4 2.49 0 4.5-2.01 4.5-4.5S19.99 7 17.5 7c-1.9 0-3.73 1.66-5.5 4Z" />
        </svg>
      );
    case 'templates':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="8" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
          <rect x="13" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case 'help':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={svgClass}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
        </svg>
      );
  }
}
