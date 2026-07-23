import { describe, expect, it, vi } from 'vitest';
import { detectTargetFormat, applySpectrumFormatPreset, applyOverlayFormatPreset } from './format-presets';
import type { PidioConfig } from '../types/app.types';

describe('format-presets utilities', () => {
  describe('detectTargetFormat', () => {
    it('detects landscape', () => {
      const config = { target: { width: 1280, height: 720 } } as unknown as PidioConfig;
      expect(detectTargetFormat(config)).toBe('landscape');
    });

    it('detects vertical', () => {
      const config = { target: { width: 1080, height: 1920 } } as unknown as PidioConfig;
      expect(detectTargetFormat(config)).toBe('vertical');
    });

    it('detects square', () => {
      const config = { target: { width: 1080, height: 1080 } } as unknown as PidioConfig;
      expect(detectTargetFormat(config)).toBe('square');
    });

    it('falls back to landscape on missing target config', () => {
      const config = {} as unknown as PidioConfig;
      expect(detectTargetFormat(config)).toBe('landscape');
    });
  });

  describe('applySpectrumFormatPreset', () => {
    it('sets landscape keys', () => {
      const updateConfig = vi.fn();
      applySpectrumFormatPreset(updateConfig, 'landscape');

      expect(updateConfig).toHaveBeenCalledWith('spectrum.enabled', true);
      expect(updateConfig).toHaveBeenCalledWith('spectrum.stylePreset', 'format-landscape');
      expect(updateConfig).toHaveBeenCalledWith('spectrum.model', 'Bar');
      expect(updateConfig).toHaveBeenCalledWith('spectrum.height', 128);
    });

    it('sets vertical keys', () => {
      const updateConfig = vi.fn();
      applySpectrumFormatPreset(updateConfig, 'vertical');

      expect(updateConfig).toHaveBeenCalledWith('spectrum.stylePreset', 'format-vertical');
      expect(updateConfig).toHaveBeenCalledWith('spectrum.model', 'Wave');
      expect(updateConfig).toHaveBeenCalledWith('spectrum.height', 176);
      expect(updateConfig).toHaveBeenCalledWith('spectrum.previewY', 57);
    });

    it('sets square keys', () => {
      const updateConfig = vi.fn();
      applySpectrumFormatPreset(updateConfig, 'square');

      expect(updateConfig).toHaveBeenCalledWith('spectrum.stylePreset', 'format-square');
      expect(updateConfig).toHaveBeenCalledWith('spectrum.height', 142);
      expect(updateConfig).toHaveBeenCalledWith('spectrum.previewY', 70);
    });
  });

  describe('applyOverlayFormatPreset', () => {
    it('sets landscape keys', () => {
      const updateConfig = vi.fn();
      applyOverlayFormatPreset(updateConfig, 'landscape');

      expect(updateConfig).toHaveBeenCalledWith('overlay.enabled', true);
      expect(updateConfig).toHaveBeenCalledWith('overlay.stylePreset', 'format-landscape');
      expect(updateConfig).toHaveBeenCalledWith('overlay.timestampPosition', 'Kiri Atas');
      expect(updateConfig).toHaveBeenCalledWith('overlay.darken', false);
    });

    it('sets vertical keys', () => {
      const updateConfig = vi.fn();
      applyOverlayFormatPreset(updateConfig, 'vertical');

      expect(updateConfig).toHaveBeenCalledWith('overlay.stylePreset', 'format-vertical');
      expect(updateConfig).toHaveBeenCalledWith('overlay.timestampPosition', 'Kanan Atas');
      expect(updateConfig).toHaveBeenCalledWith('overlay.darken', true);
      expect(updateConfig).toHaveBeenCalledWith('overlay.darkenOpacity', 16);
    });

    it('sets square keys', () => {
      const updateConfig = vi.fn();
      applyOverlayFormatPreset(updateConfig, 'square');

      expect(updateConfig).toHaveBeenCalledWith('overlay.stylePreset', 'format-square');
      expect(updateConfig).toHaveBeenCalledWith('overlay.timestampPosition', 'Kiri Atas');
      expect(updateConfig).toHaveBeenCalledWith('overlay.darkenOpacity', 12);
    });
  });
});
