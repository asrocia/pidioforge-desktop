import React from 'react';
import type { ModuleKey } from '../../types/app.types';

export function ModuleIcon({ kind }: { kind: ModuleKey }) {
  switch (kind) {
    case 'target':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 9h16M9 5v14" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="2.4" fill="currentColor" /></svg>;
    case 'branding':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.5 12 4l7 5.5V20H5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9.5 13.5h5M8.5 16.2h7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
    case 'audio':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15V9M8 18V6M12 14V10M16 19V5M20 15V9" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>;
    case 'lyrics':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h8l4 4v12H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M14 4v4h4M8 11h8M8 14h8M8 17h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
    case 'spectrum':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15c2.5 0 2.5-6 5-6s2.5 10 5 10 2.5-12 5-12 2.5 8 5 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'overlay':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="9" height="9" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" /><rect x="11" y="11" width="9" height="9" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
    case 'queue':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M16.5 16.5l1.6 1.6 3.2-3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'loop':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h8a4 4 0 0 1 0 8H9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 5 7 7l3 2M14 19l3-2-3-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'help':
      return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M9.8 9.4a2.4 2.4 0 1 1 4.2 1.6c-.8.8-1.8 1.2-1.8 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="17" r="1" fill="currentColor" /></svg>;
  }
}
