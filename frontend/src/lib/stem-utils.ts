export type Stem = {
  name?: string;
  file: string;
  volume?: number;
  pan?: number;
  solo?: boolean;
  mute?: boolean;
};

/** Create a new stem entry from a file path */
export function createStem(filePath: string): Stem {
  const name =
    filePath
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.[^/.]+$/, '') || 'track';
  return { name, file: filePath, volume: 100, pan: 0, solo: false, mute: false };
}

export function createEmptyStem(): Stem {
  return { name: 'track', file: '', volume: 100, pan: 0, solo: false, mute: false };
}

/** Add stems from paths, filtering duplicates. Returns { stems, added, skipped } */
export function addStems(current: Stem[], paths: string[]): { stems: Stem[]; added: number; skipped: number } {
  const existingFiles = new Set(current.map(s => s.file));
  const unique = paths.filter(p => !existingFiles.has(p));
  const newStems = unique.map(createStem);
  return {
    stems: [...current, ...newStems],
    added: newStems.length,
    skipped: paths.length - unique.length,
  };
}

/** Reorder stems array by moving item from one index to another */
export function reorderStems(stems: Stem[], fromIndex: number, toIndex: number): Stem[] {
  if (fromIndex === toIndex) return stems;
  if (fromIndex < 0 || fromIndex >= stems.length) return stems;
  if (toIndex < 0 || toIndex >= stems.length) return stems;
  const result = [...stems];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

/** Remove stem at index */
export function removeStem(stems: Stem[], index: number): Stem[] {
  return stems.filter((_, i) => i !== index);
}

/** Toggle solo on a stem */
export function toggleSolo(stems: Stem[], index: number): Stem[] {
  return stems.map((s, i) => ({ ...s, solo: i === index ? !s.solo : s.solo }));
}

/** Toggle mute on a stem */
export function toggleMute(stems: Stem[], index: number): Stem[] {
  return stems.map((s, i) => ({ ...s, mute: i === index ? !s.mute : s.mute }));
}

/** Update volume on a stem */
export function updateVolume(stems: Stem[], index: number, volume: number): Stem[] {
  return stems.map((s, i) => (i === index ? { ...s, volume } : s));
}

/** Serialize stems to text (for advanced editor) */
export function stemsToText(stems: Stem[]): string {
  return stems.map(x => `${x.name || 'track'}|${x.file || ''}|${x.volume ?? 100}|${x.pan ?? 0}`).join('\n');
}

/** Parse text back to stems (from advanced editor) */
export function textToStems(text: string): Stem[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, file, volume, pan] = line.split('|').map(x => x?.trim());
      return {
        name: name || 'track',
        file: file || '',
        volume: Number(volume || 100),
        pan: Number(pan || 0),
        solo: false,
        mute: false,
      };
    })
    .filter(x => x.file);
}
