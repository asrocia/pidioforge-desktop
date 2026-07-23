import { describe, expect, it } from 'vitest';
import {
  addStems,
  createStem,
  removeStem,
  reorderStems,
  stemsToText,
  textToStems,
  toggleMute,
  toggleSolo,
  updateVolume,
  type Stem,
} from './stem-utils';

const BASE_STEMS: Stem[] = [
  { name: 'vocals', file: 'C:/vocals.wav', volume: 100, pan: 0, solo: false, mute: false },
  { name: 'drums', file: 'C:/drums.wav', volume: 80, pan: 0, solo: false, mute: false },
];

describe('stem-utils', () => {
  it('creates stem from file path', () => {
    expect(createStem('C:/music/bass.wav')).toEqual({
      name: 'bass',
      file: 'C:/music/bass.wav',
      volume: 100,
      pan: 0,
      solo: false,
      mute: false,
    });
  });

  it('adds stems and filters duplicates', () => {
    const result = addStems(BASE_STEMS, ['C:/bass.wav', 'C:/vocals.wav']);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.stems).toHaveLength(3);
    expect(result.stems[2]?.name).toBe('bass');
  });

  it('reorders stems', () => {
    const reordered = reorderStems(BASE_STEMS, 0, 1);
    expect(reordered.map(stem => stem.name)).toEqual(['drums', 'vocals']);
  });

  it('ignores invalid reorder indexes', () => {
    expect(reorderStems(BASE_STEMS, -1, 1)).toEqual(BASE_STEMS);
    expect(reorderStems(BASE_STEMS, 0, 9)).toEqual(BASE_STEMS);
  });

  it('removes stem by index', () => {
    expect(removeStem(BASE_STEMS, 0).map(stem => stem.name)).toEqual(['drums']);
  });

  it('toggles solo', () => {
    const next = toggleSolo(BASE_STEMS, 1);
    expect(next[0]?.solo).toBe(false);
    expect(next[1]?.solo).toBe(true);
  });

  it('toggles mute', () => {
    const next = toggleMute(BASE_STEMS, 0);
    expect(next[0]?.mute).toBe(true);
    expect(next[1]?.mute).toBe(false);
  });

  it('updates volume', () => {
    const next = updateVolume(BASE_STEMS, 1, 65);
    expect(next[0]?.volume).toBe(100);
    expect(next[1]?.volume).toBe(65);
  });

  it('serializes stems to text', () => {
    expect(stemsToText(BASE_STEMS)).toBe('vocals|C:/vocals.wav|100|0\ndrums|C:/drums.wav|80|0');
  });

  it('parses text to stems', () => {
    expect(textToStems('bass|C:/bass.wav|90|-5')).toEqual([
      { name: 'bass', file: 'C:/bass.wav', volume: 90, pan: -5, solo: false, mute: false },
    ]);
  });
});
