import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/**
 * Fetch first few lyric lines from backend for live preview display.
 * Returns array of lyric text strings (max 3 lines).
 */
export function useLyricPreview(lyricFile: string, enabled: boolean): string[] {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || !lyricFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await api('/api/lyrics/parse', {
          method: 'POST',
          body: JSON.stringify({ file: lyricFile }),
        });
        if (!cancelled && Array.isArray(data.lines)) {
          setLines(
            data.lines
              .slice(0, 3)
              .map((line: { text?: string }) => line.text || '')
              .filter(Boolean),
          );
        }
      } catch {
        if (!cancelled) setLines([]);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lyricFile, enabled]);

  return lines;
}
