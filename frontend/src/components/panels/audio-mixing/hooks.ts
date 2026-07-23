import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../lib/api';
import { getDeep } from '../../../lib/config-path';
import { errorMessage } from '../../../lib/format';
import {
  addStems,
  createEmptyStem,
  removeStem as removeStemUtil,
  reorderStems,
  stemsToText,
  textToStems,
  toggleMute,
  toggleSolo,
  updateVolume,
  type Stem,
} from '../../../lib/stem-utils';
import type {
  AudioAnalysisState,
  AudioMixingCardProps,
  AudioPreviewState,
  StemDragState,
  StemManagementState,
} from './types';

/** Validate/analyze audio via backend, tracking busy + message state. */
export function useAudioAnalysis({ config }: AudioMixingCardProps): AudioAnalysisState {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<AudioAnalysisState['validation']>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysisState['analysis']>(null);
  const [busy, setBusy] = useState(false);

  async function validateAudio() {
    setBusy(true);
    setMessage('Validasi audio + loudness + waveform...');
    try {
      const data = await api('/api/audio/validate', {
        method: 'POST',
        body: JSON.stringify({ config, withWaveform: true }),
      });
      setValidation(data);
      setAnalysis(data);
      setMessage(
        data.ok
          ? `Audio siap. LUFS ${data.loudness?.integratedLufs ?? '-'} / Peak ${data.loudness?.truePeak ?? '-'} / Beat ${data.beats?.length || 0}`
          : `Perhatian: ${(data.warnings || []).join(' ')}`,
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function analyzeAudio() {
    setBusy(true);
    setMessage('Analisis audio utama...');
    try {
      const data = await api('/api/audio/analyze', {
        method: 'POST',
        body: JSON.stringify({ file: getDeep(config, 'input.audio'), config, seconds: 60, buckets: 180 }),
      });
      setAnalysis(data);
      setMessage(
        `Analisis selesai. LUFS ${data.loudness?.integratedLufs ?? '-'} • Peak ${data.loudness?.truePeak ?? '-'} • Beat ${data.beats?.length || 0}`,
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return { analysis, validation, message, busy, validateAudio, analyzeAudio };
}

/** Generate a short audio preview via backend. */
export function useAudioPreview({ config }: AudioMixingCardProps): AudioPreviewState {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);

  async function previewAudio() {
    setPreviewing(true);
    try {
      const data = await api('/api/audio/preview', {
        method: 'POST',
        body: JSON.stringify({ config, duration: 10 }),
      });
      if (data.url) setPreviewUrl(data.url);
    } finally {
      setPreviewing(false);
    }
  }

  return { previewUrl, previewing, previewAudio };
}

/** Drag-and-drop reordering state for the stem mixer list. */
export function useStemDrag({ config, updateConfig }: AudioMixingCardProps): StemDragState {
  const [stemDraggedIdx, setStemDraggedIdx] = useState<number | null>(null);
  const [stemDragOverIdx, setStemDragOverIdx] = useState<number | null>(null);

  function getAudioStems(): Stem[] {
    return (getDeep(config, 'audio.stems', []) || []) as Stem[];
  }

  function handleStemDragStart(e: React.DragEvent, index: number) {
    setStemDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleStemDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== stemDraggedIdx) setStemDragOverIdx(index);
  }
  function handleStemDragLeave() {
    setStemDragOverIdx(null);
  }
  function handleStemDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    setStemDragOverIdx(null);
    if (stemDraggedIdx === null || stemDraggedIdx === targetIndex) return;
    updateConfig('audio.stems', reorderStems(getAudioStems(), stemDraggedIdx, targetIndex));
    setStemDraggedIdx(null);
  }
  function handleStemDragEnd() {
    setStemDraggedIdx(null);
    setStemDragOverIdx(null);
  }

  return {
    stemDraggedIdx,
    stemDragOverIdx,
    handleStemDragStart,
    handleStemDragOver,
    handleStemDragLeave,
    handleStemDrop,
    handleStemDragEnd,
  };
}

/** Playlist text fields, stem mixer actions, and platform preset application. */
export function useStemManagement({ config, updateConfig }: AudioMixingCardProps): StemManagementState {
  const stems = useMemo(() => (getDeep(config, 'audio.stems', []) || []) as Stem[], [config]);
  const [introText, setIntroText] = useState((getDeep(config, 'audio.introSongs', []) || []).join('\n'));
  const [slotText, setSlotText] = useState((getDeep(config, 'audio.songs', []) || []).join('\n'));
  const [stemsText, setStemsText] = useState(stemsToText(stems));
  const [stemMessage, setStemMessage] = useState('');

  // Sync stemsText when stems change externally (intentional derived-state sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStemsText(stemsToText(stems));
  }, [stems]);

  function getAudioStems(): Stem[] {
    return stems;
  }

  function applyPreset(v: string) {
    updateConfig('audio.platformPreset', v);
    if (v === 'youtube-music' || v === 'youtube-clean') {
      updateConfig('audio.normalize', true);
      updateConfig('audio.limiter', true);
      updateConfig('audio.compressor', true);
      updateConfig('audio.audioBitrate', '256k');
      updateConfig('audio.bgmVolume', 100);
      updateConfig('audio.masterGain', 100);
      updateConfig('audio.bassGain', 1);
      updateConfig('audio.trebleGain', 1);
    }
    if (v === 'youtube-shorts') {
      updateConfig('audio.normalize', true);
      updateConfig('audio.limiter', true);
      updateConfig('audio.compressor', true);
      updateConfig('audio.audioBitrate', '192k');
      updateConfig('audio.masterGain', 108);
      updateConfig('audio.bassGain', 2);
      updateConfig('audio.trebleGain', 2);
      updateConfig('audio.reactiveFx', 'Beat Flash');
    }
    if (v === 'tiktok-loud' || v === 'loud') {
      updateConfig('audio.normalize', true);
      updateConfig('audio.limiter', true);
      updateConfig('audio.compressor', true);
      updateConfig('audio.masterGain', 115);
      updateConfig('audio.bassGain', 3);
      updateConfig('audio.trebleGain', 2);
    }
    if (v === 'podcast-clean') {
      updateConfig('audio.normalize', true);
      updateConfig('audio.limiter', true);
      updateConfig('audio.compressor', true);
      updateConfig('audio.highPass', 80);
      updateConfig('audio.lowPass', 12000);
      updateConfig('audio.noiseGate', true);
      updateConfig('audio.reactiveFx', 'Mati');
    }
    if (v === 'background-soft' || v === 'soft') {
      updateConfig('audio.normalize', true);
      updateConfig('audio.limiter', true);
      updateConfig('audio.masterGain', 85);
      updateConfig('audio.bassGain', -1);
      updateConfig('audio.trebleGain', -1);
      updateConfig('audio.reactiveFx', 'Mati');
    }
    if (v === 'cinematic-bass' || v === 'bass') {
      updateConfig('audio.normalize', true);
      updateConfig('audio.limiter', true);
      updateConfig('audio.compressor', true);
      updateConfig('audio.bassGain', 5);
      updateConfig('audio.midGain', -1);
      updateConfig('audio.trebleGain', 1);
      updateConfig('audio.masterGain', 105);
    }
  }

  function commitIntro() {
    updateConfig(
      'audio.introSongs',
      introText
        .split(/\r?\n/)
        .map((x: string) => x.trim())
        .filter(Boolean),
    );
  }
  function commitSlots() {
    updateConfig(
      'audio.songs',
      slotText
        .split(/\r?\n/)
        .map((x: string) => x.trim())
        .filter(Boolean),
    );
  }
  function commitStems() {
    updateConfig('audio.stems', textToStems(stemsText));
  }

  function toggleStemSolo(index: number) {
    updateConfig('audio.stems', toggleSolo(getAudioStems(), index));
  }
  function toggleStemMute(index: number) {
    updateConfig('audio.stems', toggleMute(getAudioStems(), index));
  }
  function updateStemVolume(index: number, volume: number) {
    updateConfig('audio.stems', updateVolume(getAudioStems(), index, volume));
  }
  function addEmptyStem() {
    updateConfig('audio.stems', [...getAudioStems(), createEmptyStem()]);
  }
  function removeStem(index: number) {
    updateConfig('audio.stems', removeStemUtil(getAudioStems(), index));
  }

  async function addMultiStems() {
    if (!window.pidioforge?.pickPaths) {
      alert('Multi-select hanya tersedia di aplikasi desktop. Jalankan PidioForge Desktop.');
      return;
    }
    try {
      const paths = await window.pidioforge.pickPaths({
        kind: 'file',
        title: 'Pilih file audio untuk stems',
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'] }],
      });
      if (paths.length === 0) return;

      const result = addStems(getAudioStems(), paths);
      if (result.added === 0) {
        setStemMessage('Semua file terpilih sudah ada di stem mixer.');
        return;
      }
      if (result.skipped > 0) {
        setStemMessage(`${result.skipped} file duplikat dilewati.`);
      } else {
        setStemMessage('Stem baru berhasil ditambahkan.');
      }
      updateConfig('audio.stems', result.stems);
    } catch (error) {
      console.error('Gagal memilih file audio', error);
      alert('Gagal membuka dialog pemilih file.');
    }
  }

  return {
    stems: getAudioStems(),
    introText,
    slotText,
    stemsText,
    stemMessage,
    setIntroText,
    setSlotText,
    setStemsText,
    setStemMessage,
    commitIntro,
    commitSlots,
    commitStems,
    applyPreset,
    toggleStemSolo,
    toggleStemMute,
    updateStemVolume,
    addEmptyStem,
    addMultiStems,
    removeStem,
  };
}
