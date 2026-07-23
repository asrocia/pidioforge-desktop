import { useState } from 'react';
import { api } from '../../../lib/api';
import { getDeep } from '../../../lib/config-path';
import { errorMessage } from '../../../lib/format';
import type { LyricsCardProps, LyricsEngineState, LyricsValidation, LyricLine } from './types';

export function useLyricsEngine({ config, updateConfig }: LyricsCardProps): LyricsEngineState {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<LyricLine[]>([]);
  const [srt, setSrt] = useState('');
  const [lrc, setLrc] = useState('');
  const [vtt, setVtt] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<LyricsValidation | null>(null);
  const [busy, setBusy] = useState(false);

  function applyLyricPreset(v: string) {
    updateConfig('lyrics.stylePreset', v);
    if (v === 'modern') {
      updateConfig('lyrics.font', 'Arial');
      updateConfig('lyrics.scale', 30);
      updateConfig('lyrics.outline', 2);
      updateConfig('lyrics.shadow', 1);
      updateConfig('lyrics.color', '#ffffff');
      updateConfig('lyrics.highlightColor', '#22c55e');
      updateConfig('lyrics.position', 'Bawah');
      updateConfig('lyrics.uppercase', false);
    }
    if (v === 'karaoke') {
      updateConfig('lyrics.karaoke', true);
      updateConfig('lyrics.wordByWord', true);
      updateConfig('lyrics.scale', 32);
      updateConfig('lyrics.color', '#ffffff');
      updateConfig('lyrics.highlightColor', '#facc15');
      updateConfig('lyrics.outline', 2);
    }
    if (v === 'shorts-bold') {
      updateConfig('lyrics.uppercase', true);
      updateConfig('lyrics.scale', 38);
      updateConfig('lyrics.maxChars', 26);
      updateConfig('lyrics.outline', 3);
      updateConfig('lyrics.position', 'Tengah');
      updateConfig('lyrics.safeArea', true);
    }
    if (v === 'minimal') {
      updateConfig('lyrics.scale', 24);
      updateConfig('lyrics.outline', 1);
      updateConfig('lyrics.shadow', 0);
      updateConfig('lyrics.color', '#eeeeee');
      updateConfig('lyrics.position', 'Bawah');
      updateConfig('lyrics.karaoke', false);
    }
  }

  async function parseLyrics() {
    setBusy(true);
    setMessage('Membaca lirik...');
    try {
      const data = await api('/api/lyrics/parse', {
        method: 'POST',
        body: JSON.stringify({ text, file: getDeep(config, 'lyrics.file'), config }),
      });
      setParsed(data.lines || []);
      setSrt(data.srt || '');
      setLrc(data.lrc || '');
      setVtt(data.vtt || '');
      setMessage(`${data.lines?.length || 0} baris lirik diparse.`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function autoAlign() {
    setBusy(true);
    setMessage('Menyelaraskan lirik...');
    try {
      const data = await api('/api/lyrics/auto-align', {
        method: 'POST',
        body: JSON.stringify({
          text,
          file: getDeep(config, 'lyrics.file'),
          audio: getDeep(config, 'input.audio'),
          config,
          format: getDeep(config, 'lyrics.exportFormat', 'srt'),
        }),
      });
      setParsed(data.lines || []);
      setSrt(data.srt || '');
      setLrc(data.lrc || '');
      setVtt(data.vtt || '');
      setValidation({
        ok: (data.quality?.score || 0) >= Number(getDeep(config, 'lyrics.qualityGate', 82)),
        warnings: data.quality?.warnings || [],
        quality: data.quality,
        beats: data.beats || [],
      });
      setMessage(
        `Align otomatis selesai: ${data.lines?.length || 0} baris / skor ${data.quality?.score ?? '-'} / beat ${data.beats?.length || 0}${
          data.outputFile ? ` / tersimpan ${data.outputFile}` : ''
        }`,
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function validateLyrics() {
    setBusy(true);
    setMessage('Memeriksa timeline lirik...');
    try {
      const data = await api('/api/lyrics/validate', {
        method: 'POST',
        body: JSON.stringify({ lines: parsed, config }),
      });
      setValidation(data);
      setMessage(
        data.ok
          ? `Lirik siap: ${data.lineCount} baris / skor ${data.quality?.score ?? '-'}`
          : `Perhatian: ${(data.warnings || []).join(' ')}`,
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function exportLyrics(format: string) {
    setBusy(true);
    setMessage(`Menyiapkan ekspor ${format.toUpperCase()}...`);
    try {
      const data = await api('/api/lyrics/export', {
        method: 'POST',
        body: JSON.stringify({
          lines: parsed,
          text,
          file: getDeep(config, 'lyrics.file'),
          config,
          format,
          outputFile: getDeep(config, 'lyrics.outputFile'),
        }),
      });
      if (format === 'srt') setSrt(data.content || '');
      if (format === 'lrc') setLrc(data.content || '');
      if (format === 'vtt') setVtt(data.content || '');
      setMessage(data.outputFile ? `Export berhasil: ${data.outputFile}` : `Export ${format.toUpperCase()} siap.`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return {
    text,
    parsed,
    srt,
    lrc,
    vtt,
    message,
    validation,
    busy,
    setText,
    setParsed,
    setSrt,
    setLrc,
    setVtt,
    setMessage,
    setBusy,
    setValidation,
    applyLyricPreset,
    parseLyrics,
    autoAlign,
    validateLyrics,
    exportLyrics,
  };
}
