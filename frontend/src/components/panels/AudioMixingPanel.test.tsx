import { describe, it, expect } from 'vitest';
import { setDeep, getDeep } from '../../lib/config-path';

const TEST_CONFIG = {
  branding: { layerOrder: 'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird' },
  audio: {
    stems: [
      { name: 'vocals', file: 'C:/vocals.wav', volume: 100, pan: 0, solo: false, mute: false },
      { name: 'drums', file: 'C:/drums.wav', volume: 80, pan: 0, solo: false, mute: false },
    ],
  },
};

describe('AudioMixingPanel config logic', () => {
  describe('Stem handling', () => {
    it('reads stems array', () => {
      const stems = getDeep(TEST_CONFIG, 'audio.stems', []);
      expect(stems).toHaveLength(2);
      expect(stems[0]).toMatchObject({ name: 'vocals', file: 'C:/vocals.wav' });
    });

    it('adds stem immutably', () => {
      const newStem = { name: 'bass', file: 'C:/bass.wav', volume: 90, pan: 10, solo: false, mute: false };
      const updated = setDeep(TEST_CONFIG, 'audio.stems', [
        ...(getDeep(TEST_CONFIG, 'audio.stems', []) as any[]),
        newStem,
      ]);
      const stems = getDeep(updated, 'audio.stems', []);
      expect(stems).toHaveLength(3);
      expect(stems[2]).toMatchObject(newStem);
    });

    it('removes stem by index immutably', () => {
      const stems = getDeep(TEST_CONFIG, 'audio.stems', []) as any[];
      const updated = setDeep(TEST_CONFIG, 'audio.stems', stems.slice(1));
      const newStems = getDeep(updated, 'audio.stems', []);
      expect(newStems).toHaveLength(1);
      expect(newStems[0].name).toBe('drums');
    });

    it('toggles solo', () => {
      const updated = setDeep(
        TEST_CONFIG,
        'audio.stems',
        (getDeep(TEST_CONFIG, 'audio.stems', []) as any[]).map((s, i) => ({ ...s, solo: i === 0 })),
      );
      const stems = getDeep(updated, 'audio.stems', []);
      expect(stems[0].solo).toBe(true);
      expect(stems[1].solo).toBe(false);
    });

    it('toggles mute', () => {
      const updated = setDeep(
        TEST_CONFIG,
        'audio.stems',
        (getDeep(TEST_CONFIG, 'audio.stems', []) as any[]).map((s, i) => ({ ...s, mute: i === 1 })),
      );
      const stems = getDeep(updated, 'audio.stems', []);
      expect(stems[0].mute).toBe(false);
      expect(stems[1].mute).toBe(true);
    });

    it('updates volume', () => {
      const updated = setDeep(
        TEST_CONFIG,
        'audio.stems',
        (getDeep(TEST_CONFIG, 'audio.stems', []) as any[]).map((s, i) => (i === 0 ? { ...s, volume: 70 } : s)),
      );
      const stems = getDeep(updated, 'audio.stems', []);
      expect(stems[0].volume).toBe(70);
      expect(stems[1].volume).toBe(80);
    });
  });

  describe('Stem deduplication logic', () => {
    it('filters duplicate file paths', () => {
      const existing = ['C:/vocals.wav', 'C:/drums.wav'];
      const selected = ['C:/bass.wav', 'C:/vocals.wav']; // duplicate
      const newFiles = selected.filter(path => !existing.includes(path));
      expect(newFiles).toEqual(['C:/bass.wav']);
    });
  });
});

describe('Stem reorder logic', () => {
  const original = [
    { name: 'vocal', file: 'vocal.wav', volume: 100, pan: 0, solo: false, mute: false },
    { name: 'guitar', file: 'guitar.wav', volume: 80, pan: -10, solo: false, mute: false },
    { name: 'bass', file: 'bass.wav', volume: 90, pan: 0, solo: false, mute: false },
  ];

  it('reorders stems by swapping', () => {
    const stems = [...original];
    const [moved] = stems.splice(0, 1);
    stems.splice(2, 0, moved);
    expect(stems.map(s => s.name)).toEqual(['guitar', 'bass', 'vocal']);
  });

  it('preserves other fields after reorder', () => {
    const stems = [...original];
    stems[0].solo = true;
    stems[1].mute = true;
    stems[2].volume = 110;

    const reordered = [...stems];
    [reordered[0], reordered[2]] = [reordered[2], reordered[0]];

    expect(reordered[0].name).toBe('bass');
    expect(reordered[0].volume).toBe(110);
    expect(reordered[0].solo).toBe(false);
    expect(reordered[0].mute).toBe(false);

    expect(reordered[2].name).toBe('vocal');
    expect(reordered[2].solo).toBe(true);
  });
});
