import { getDeep } from '../lib/config-path';
import type { PidioConfig } from '../types/app.types';

export function detectTargetFormat(config: PidioConfig): 'landscape' | 'vertical' | 'square' {
  const width = Number(getDeep(config, 'target.width', 1280));
  const height = Number(getDeep(config, 'target.height', 720));
  if (height > width) return 'vertical';
  if (height === width) return 'square';
  return 'landscape';
}

export function applySpectrumFormatPreset(
  updateConfig: (path: string, value: unknown) => void,
  format: 'landscape' | 'vertical' | 'square',
): void {
  updateConfig('spectrum.enabled', true);
  updateConfig('spectrum.progressBar', true);
  updateConfig('spectrum.nowPlaying', true);
  updateConfig('spectrum.widthMode', 'full');
  if (format === 'vertical') {
    updateConfig('spectrum.stylePreset', 'format-vertical');
    updateConfig('spectrum.model', 'Wave');
    updateConfig('spectrum.position', 'Tengah');
    updateConfig('spectrum.previewY', 57);
    updateConfig('spectrum.y', 7);
    updateConfig('spectrum.height', 176);
    updateConfig('spectrum.transparency', 74);
    updateConfig('spectrum.marginY', 46);
    updateConfig('spectrum.nowPlayingPosition', 'Atas');
    updateConfig('spectrum.nowPlayingX', 50);
    updateConfig('spectrum.nowPlayingY', 12);
    updateConfig('spectrum.nowPlayingFontSize', 28);
  } else if (format === 'square') {
    updateConfig('spectrum.stylePreset', 'format-square');
    updateConfig('spectrum.model', 'Wave');
    updateConfig('spectrum.position', 'Bawah');
    updateConfig('spectrum.previewY', 70);
    updateConfig('spectrum.y', 20);
    updateConfig('spectrum.height', 142);
    updateConfig('spectrum.transparency', 78);
    updateConfig('spectrum.marginY', 34);
    updateConfig('spectrum.nowPlayingPosition', 'Atas');
    updateConfig('spectrum.nowPlayingX', 50);
    updateConfig('spectrum.nowPlayingY', 14);
    updateConfig('spectrum.nowPlayingFontSize', 24);
  } else {
    updateConfig('spectrum.stylePreset', 'format-landscape');
    updateConfig('spectrum.model', 'Bar');
    updateConfig('spectrum.position', 'Bawah');
    updateConfig('spectrum.previewY', 75);
    updateConfig('spectrum.y', 25);
    updateConfig('spectrum.height', 128);
    updateConfig('spectrum.transparency', 82);
    updateConfig('spectrum.marginY', 32);
    updateConfig('spectrum.nowPlayingPosition', 'Atas');
    updateConfig('spectrum.nowPlayingX', 50);
    updateConfig('spectrum.nowPlayingY', 13);
    updateConfig('spectrum.nowPlayingFontSize', 26);
  }
}

export function applyOverlayFormatPreset(
  updateConfig: (path: string, value: unknown) => void,
  format: 'landscape' | 'vertical' | 'square',
): void {
  updateConfig('overlay.enabled', true);
  updateConfig('overlay.timestamp', true);
  updateConfig('overlay.frameBorder', false);
  updateConfig('overlay.scanlines', false);
  updateConfig('overlay.filmGrain', false);
  updateConfig('overlay.lowerThirdEnabled', true);
  if (format === 'vertical') {
    updateConfig('overlay.stylePreset', 'format-vertical');
    updateConfig('overlay.timestampPosition', 'Kanan Atas');
    updateConfig('overlay.lowerThirdPosition', 'Tengah');
    updateConfig('overlay.lowerThirdAt', 2);
    updateConfig('overlay.lowerThirdDuration', 4);
    updateConfig('overlay.darken', true);
    updateConfig('overlay.darkenOpacity', 16);
    updateConfig('overlay.letterbox', false);
  } else if (format === 'square') {
    updateConfig('overlay.stylePreset', 'format-square');
    updateConfig('overlay.timestampPosition', 'Kiri Atas');
    updateConfig('overlay.lowerThirdPosition', 'Bawah');
    updateConfig('overlay.lowerThirdAt', 2);
    updateConfig('overlay.lowerThirdDuration', 4);
    updateConfig('overlay.darken', true);
    updateConfig('overlay.darkenOpacity', 12);
    updateConfig('overlay.letterbox', false);
  } else {
    updateConfig('overlay.stylePreset', 'format-landscape');
    updateConfig('overlay.timestampPosition', 'Kiri Atas');
    updateConfig('overlay.lowerThirdPosition', 'Bawah');
    updateConfig('overlay.lowerThirdAt', 2);
    updateConfig('overlay.lowerThirdDuration', 5);
    updateConfig('overlay.darken', false);
    updateConfig('overlay.darkenOpacity', 10);
    updateConfig('overlay.letterbox', false);
  }
}
