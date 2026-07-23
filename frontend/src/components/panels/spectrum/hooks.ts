import { useState } from 'react';
import { api } from '../../../lib/api';
import { getDeep } from '../../../lib/config-path';
import { errorMessage } from '../../../lib/format';
import { detectTargetFormat } from '../../../utils/format-presets';
import { mediaKind } from '../../../utils/media';
import type { SpectrumCardProps, SpectrumEngineState, SpectrumPreview } from './types';

export function useSpectrumEngine({ config, updateConfig }: SpectrumCardProps): SpectrumEngineState {
  const [preview, setPreview] = useState<SpectrumPreview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<'nowPlaying' | 'spectrum' | ''>('');

  const format = detectTargetFormat(config);
  const tuned = preview?.tuned;
  const peaks = preview?.waveform?.peaks || [];
  const visual = getDeep(config, 'input.visual', '');
  const visualType = mediaKind(visual);
  const npX = Number(getDeep(config, 'spectrum.nowPlayingX', 50));
  const npY = Number(
    getDeep(
      config,
      'spectrum.nowPlayingY',
      getDeep(config, 'spectrum.nowPlayingPosition', 'Atas') === 'Bawah'
        ? 84
        : getDeep(config, 'spectrum.nowPlayingPosition', 'Atas') === 'Tengah'
          ? 50
          : 14,
    ),
  );
  const spY = Number(
    getDeep(
      config,
      'spectrum.previewY',
      getDeep(config, 'spectrum.position', 'Bawah') === 'Atas'
        ? 22
        : getDeep(config, 'spectrum.position', 'Bawah') === 'Tengah'
          ? 50
          : 74,
    ),
  );
  const spectrumheight = Number(getDeep(config, 'spectrum.height', 128));
  const spectrumPreviewheight = Math.max(42, Math.min(160, Math.round(spectrumheight * 0.56)));
  const galleryEnabled = Boolean(getDeep(config, 'spectrum.gallery.enabled', false));
  const galleryImages: string[] = getDeep(config, 'spectrum.gallery.images', []);
  const galleryActiveIndex = Number(getDeep(config, 'spectrum.gallery.activeIndex', 0));

  function setGalleryImages(images: string[]) {
    updateConfig('spectrum.gallery.images', images);
    const active = images[Math.min(galleryActiveIndex, Math.max(0, images.length - 1))];
    if (active) updateConfig('input.visual', active);
  }

  function setGalleryActiveIndex(index: number) {
    updateConfig('spectrum.gallery.activeIndex', index);
    const active = galleryImages[index];
    if (active) updateConfig('input.visual', active);
  }

  function applyPreset(v: string) {
    updateConfig('spectrum.stylePreset', v);
    if (v === 'clean-wave') {
      updateConfig('spectrum.enabled', true);
      updateConfig('spectrum.model', 'Wave');
      updateConfig('spectrum.position', 'Bawah');
      updateConfig('spectrum.previewY', 74);
      updateConfig('spectrum.nowPlayingY', 14);
      updateConfig('spectrum.height', 128);
      updateConfig('spectrum.transparency', 78);
      updateConfig('spectrum.colors', ['white']);
      updateConfig('spectrum.progressBar', true);
      updateConfig('spectrum.nowPlaying', true);
    }
    if (v === 'neon-bars') {
      updateConfig('spectrum.enabled', true);
      updateConfig('spectrum.model', 'Bar');
      updateConfig('spectrum.position', 'Bawah');
      updateConfig('spectrum.previewY', 74);
      updateConfig('spectrum.nowPlayingY', 14);
      updateConfig('spectrum.height', 160);
      updateConfig('spectrum.transparency', 85);
      updateConfig('spectrum.colors', ['#22c55e', '#38bdf8']);
      updateConfig('spectrum.color1', '#22c55e');
      updateConfig('spectrum.color2', '#38bdf8');
      updateConfig('spectrum.glow', true);
      updateConfig('spectrum.glowStrength', 45);
      updateConfig('spectrum.progressColor', '#22c55e');
    }
    if (v === 'minimal-line') {
      updateConfig('spectrum.enabled', true);
      updateConfig('spectrum.model', 'Line');
      updateConfig('spectrum.height', 84);
      updateConfig('spectrum.transparency', 65);
      updateConfig('spectrum.colors', ['white']);
      updateConfig('spectrum.progressStyle', 'thin');
      updateConfig('spectrum.nowPlayingPosition', 'Atas');
      updateConfig('spectrum.nowPlayingY', 14);
    }
    if (v === 'shorts-center') {
      updateConfig('spectrum.enabled', true);
      updateConfig('spectrum.model', 'Wave');
      updateConfig('spectrum.position', 'Tengah');
      updateConfig('spectrum.previewY', 55);
      updateConfig('spectrum.height', 180);
      updateConfig('spectrum.transparency', 72);
      updateConfig('spectrum.colors', ['white', '#facc15']);
      updateConfig('spectrum.color1', 'white');
      updateConfig('spectrum.color2', '#facc15');
      updateConfig('spectrum.nowPlayingPosition', 'Atas');
      updateConfig('spectrum.nowPlayingY', 14);
    }
  }

  async function loadPreview() {
    setBusy(true);
    setMessage('Generate preview spectrum...');
    try {
      const data = await api('/api/spectrum/preview', {
        method: 'POST',
        body: JSON.stringify({ config, audio: getDeep(config, 'input.audio'), seconds: 45, buckets: 96 }),
      });
      setPreview(data);
      setMessage(
        data.ok
          ? `Preview siap / beat ${data.beats?.length || 0} / ${data.nowPlaying?.text || ''}`
          : 'Preview waveform belum tersedia.',
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function analyzeAndTune() {
    setBusy(true);
    setMessage('Analisis spectrum + auto tune...');
    try {
      const data = await api('/api/spectrum/analyze', {
        method: 'POST',
        body: JSON.stringify({ config, audio: getDeep(config, 'input.audio'), seconds: 60, buckets: 160 }),
      });
      setPreview(data);
      if (data.recommendedPatch?.spectrum) {
        Object.entries(data.recommendedPatch.spectrum).forEach(([k, v]) => updateConfig(`spectrum.${k}`, v));
      }
      setMessage(
        data.ok
          ? `Penyesuaian target otomatis: Sensitivitas ${data.tuned?.Sensitivitas}, height ${data.tuned?.height}, dynamic ${data.tuned?.dynamicRange}`
          : 'Analisis spectrum belum tersedia.',
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function commitColors() {
    const c1 = getDeep(config, 'spectrum.color1', 'white');
    const c2 = getDeep(config, 'spectrum.color2', '');
    updateConfig('spectrum.colors', [c1, c2].filter(Boolean));
  }

  function setDragPosition(e: React.MouseEvent<HTMLDivElement>, target = dragging) {
    if (!target) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    if (target === 'nowPlaying') {
      updateConfig('spectrum.nowPlayingX', Math.round(x));
      updateConfig('spectrum.nowPlayingY', Math.round(y));
      updateConfig('spectrum.nowPlayingPosition', y < 34 ? 'Atas' : y > 66 ? 'Bawah' : 'Tengah');
    } else {
      updateConfig('spectrum.previewY', Math.round(y));
      updateConfig('spectrum.y', Math.round(y - 50));
      updateConfig('spectrum.position', y < 34 ? 'Atas' : y > 66 ? 'Bawah' : 'Tengah');
    }
  }

  function editNowPlaying(text: string) {
    updateConfig('input.title', text.trim() || 'Now Playing');
    updateConfig('spectrum.nowPlayingTemplate', '{title}');
  }

  return {
    preview,
    message,
    busy,
    dragging,
    setDragging,
    tuned,
    peaks,
    format,
    visual,
    visualType,
    npX,
    npY,
    spY,
    spectrumheight,
    spectrumPreviewheight,
    galleryEnabled,
    galleryImages,
    galleryActiveIndex,
    setGalleryImages,
    setGalleryActiveIndex,
    applyPreset,
    loadPreview,
    analyzeAndTune,
    commitColors,
    setDragPosition,
    editNowPlaying,
  };
}
