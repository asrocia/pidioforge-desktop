import React, { useState } from 'react';
import { Field, Check, TextInput, SelectInput, Slider } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';

export function LyricsPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<any[]>([]);
  const [srt, setSrt] = useState('');
  const [lrc, setLrc] = useState('');
  const [vtt, setVtt] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  function applyLyricPreset(v: string) {
    updateConfig('lyrics.stylePreset', v);
    if (v === 'modern') { updateConfig('lyrics.font', 'Arial'); updateConfig('lyrics.scale', 30); updateConfig('lyrics.outline', 2); updateConfig('lyrics.shadow', 1); updateConfig('lyrics.color', '#ffffff'); updateConfig('lyrics.highlightColor', '#22c55e'); updateConfig('lyrics.position', 'Bawah'); updateConfig('lyrics.uppercase', false); }
    if (v === 'karaoke') { updateConfig('lyrics.karaoke', true); updateConfig('lyrics.wordByWord', true); updateConfig('lyrics.scale', 32); updateConfig('lyrics.color', '#ffffff'); updateConfig('lyrics.highlightColor', '#facc15'); updateConfig('lyrics.outline', 2); }
    if (v === 'shorts-bold') { updateConfig('lyrics.uppercase', true); updateConfig('lyrics.scale', 38); updateConfig('lyrics.maxChars', 26); updateConfig('lyrics.outline', 3); updateConfig('lyrics.position', 'Tengah'); updateConfig('lyrics.safeArea', true); }
    if (v === 'minimal') { updateConfig('lyrics.scale', 24); updateConfig('lyrics.outline', 1); updateConfig('lyrics.shadow', 0); updateConfig('lyrics.color', '#eeeeee'); updateConfig('lyrics.position', 'Bawah'); updateConfig('lyrics.karaoke', false); }
  }
  async function parseLyrics() {
    setBusy(true); setMessage('Membaca lirik...');
    try {
      const data = await api('/api/lyrics/parse', { method: 'POST', body: JSON.stringify({ text, file: getDeep(config, 'lyrics.file'), config }) });
      setParsed(data.lines || []); setSrt(data.srt || ''); setLrc(data.lrc || ''); setVtt(data.vtt || ''); setMessage(`${data.lines?.length || 0} baris lirik diparse.`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function autoAlign() {
    setBusy(true); setMessage('Menyelaraskan lirik...');
    try {
      const data = await api('/api/lyrics/auto-align', { method: 'POST', body: JSON.stringify({ text, file: getDeep(config, 'lyrics.file'), audio: getDeep(config, 'input.audio'), config, format: getDeep(config, 'lyrics.exportFormat', 'srt') }) });
      setParsed(data.lines || []); setSrt(data.srt || ''); setLrc(data.lrc || ''); setVtt(data.vtt || ''); setValidation({ ok: (data.quality?.score || 0) >= Number(getDeep(config, 'lyrics.qualityGate', 82)), warnings: data.quality?.warnings || [], quality: data.quality, beats: data.beats || [] }); setMessage(`Align otomatis selesai: ${data.lines?.length || 0} baris / skor ${data.quality?.score ?? '-'} / beat ${data.beats?.length || 0}${data.outputFile ? ` / tersimpan ${data.outputFile}` : ''}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function validateLyrics() {
    setBusy(true); setMessage('Memeriksa timeline lirik...');
    try {
      const data = await api('/api/lyrics/validate', { method: 'POST', body: JSON.stringify({ lines: parsed, config }) });
      setValidation(data); setMessage(data.ok ? `Lirik siap: ${data.lineCount} baris / skor ${data.quality?.score ?? '-'}` : `Perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function exportLyrics(format: string) {
    setBusy(true); setMessage(`Menyiapkan ekspor ${format.toUpperCase()}...`);
    try {
      const data = await api('/api/lyrics/export', { method: 'POST', body: JSON.stringify({ lines: parsed, text, file: getDeep(config, 'lyrics.file'), config, format, outputFile: getDeep(config, 'lyrics.outputFile') }) });
      if (format === 'srt') setSrt(data.content || ''); if (format === 'lrc') setLrc(data.content || ''); if (format === 'vtt') setVtt(data.content || '');
      setMessage(data.outputFile ? `Export berhasil: ${data.outputFile}` : `Export ${format.toUpperCase()} siap.`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  const previewRows = parsed.slice(0, 6);
  const outputPreview = getDeep(config, 'lyrics.exportFormat', 'srt') === 'lrc' ? lrc : getDeep(config, 'lyrics.exportFormat', 'srt') === 'vtt' ? vtt : srt;
  return (
    <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Lyrics Engine</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Auto-align, timing, dan styling lirik</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Auto-Fetch Lyrics */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Auto-Fetch Lyrics</h3>
          <Check label="Enable Auto-Fetch" checked={Boolean(getDeep(config, 'lyrics.autoFetch.enabled', false))} onChange={v => updateConfig('lyrics.autoFetch.enabled', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <SelectInput value={getDeep(config, 'lyrics.autoFetch.source', 'genius')} onChange={v => updateConfig('lyrics.autoFetch.source', v)}>
                <option value="genius">Genius</option>
                <option value="musixmatch">Musixmatch</option>
                <option value="azlyrics">AZLyrics</option>
                <option value="auto">Auto (Try All)</option>
              </SelectInput>
            </Field>
            <Field label="Fallback">
              <SelectInput value={getDeep(config, 'lyrics.autoFetch.fallback', 'manual')} onChange={v => updateConfig('lyrics.autoFetch.fallback', v)}>
                <option value="manual">Manual Input</option>
                <option value="transcribe">AI Transcribe</option>
                <option value="skip">Skip</option>
              </SelectInput>
            </Field>
          </div>
          <Field label="Song Title">
            <TextInput value={getDeep(config, 'lyrics.autoFetch.songTitle', '')} onChange={v => updateConfig('lyrics.autoFetch.songTitle', v)} placeholder="Enter song title" />
          </Field>
          <Field label="Artist Name">
            <TextInput value={getDeep(config, 'lyrics.autoFetch.artist', '')} onChange={v => updateConfig('lyrics.autoFetch.artist', v)} placeholder="Enter artist name" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="API Key (Optional)">
              <TextInput type="password" value={getDeep(config, 'lyrics.autoFetch.apiKey', '')} onChange={v => updateConfig('lyrics.autoFetch.apiKey', v)} placeholder="For premium access" />
            </Field>
            <Field label="Timeout (s)">
              <TextInput type="number" value={getDeep(config, 'lyrics.autoFetch.timeout', 10)} onChange={v => updateConfig('lyrics.autoFetch.timeout', v)} />
            </Field>
            <Field label="Retry Count">
              <TextInput type="number" value={getDeep(config, 'lyrics.autoFetch.retries', 3)} onChange={v => updateConfig('lyrics.autoFetch.retries', v)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={async () => {
              setBusy(true); setMessage('Fetching lyrics...');
              try {
                const data = await api('/api/lyrics/fetch', { 
                  method: 'POST', 
                  body: JSON.stringify({ 
                    title: getDeep(config, 'lyrics.autoFetch.songTitle'),
                    artist: getDeep(config, 'lyrics.autoFetch.artist'),
                    source: getDeep(config, 'lyrics.autoFetch.source'),
                    apiKey: getDeep(config, 'lyrics.autoFetch.apiKey'),
                    config 
                  }) 
                });
                setText(data.lyrics || '');
                setMessage(`Lyrics fetched from ${data.source}: ${data.lyrics?.split('\n').length || 0} lines`);
              } catch (e: any) { setMessage(e.message); }
              finally { setBusy(false); }
            }} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🔍 Fetch Lyrics
            </button>
            <button onClick={() => {
              const audioFile = getDeep(config, 'input.audio', '');
              if (audioFile) {
                const filename = audioFile.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || '';
                const parts = filename.split(/[-_]/);
                if (parts.length >= 2) {
                  updateConfig('lyrics.autoFetch.artist', parts[0].trim());
                  updateConfig('lyrics.autoFetch.songTitle', parts.slice(1).join(' ').trim());
                  setMessage('Auto-detected from filename');
                }
              }
            }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">
              🎵 Auto-Detect
            </button>
          </div>
          <Check label="Auto-clean fetched lyrics" checked={Boolean(getDeep(config, 'lyrics.autoFetch.autoClean', true))} onChange={v => updateConfig('lyrics.autoFetch.autoClean', v)} />
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Auto-Fetch akan mencari lirik online berdasarkan judul & artis. Gunakan Auto-Detect untuk ekstrak info dari nama file audio.
          </div>
        </div>

        {/* AI Transcription */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">AI Transcription</h3>
          <Check label="Enable AI Transcription" checked={Boolean(getDeep(config, 'lyrics.transcription.enabled', false))} onChange={v => updateConfig('lyrics.transcription.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Engine">
              <SelectInput value={getDeep(config, 'lyrics.transcription.engine', 'whisper')} onChange={v => updateConfig('lyrics.transcription.engine', v)}>
                <option value="whisper">Whisper (Local)</option>
                <option value="whisper-api">Whisper API</option>
                <option value="google">Google Speech</option>
                <option value="azure">Azure Speech</option>
              </SelectInput>
            </Field>
            <Field label="Model Size">
              <SelectInput value={getDeep(config, 'lyrics.transcription.modelSize', 'base')} onChange={v => updateConfig('lyrics.transcription.modelSize', v)}>
                <option value="tiny">Tiny (Fast)</option>
                <option value="base">Base</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large (Accurate)</option>
              </SelectInput>
            </Field>
            <Field label="Language">
              <SelectInput value={getDeep(config, 'lyrics.transcription.language', 'auto')} onChange={v => updateConfig('lyrics.transcription.language', v)}>
                <option value="auto">Auto-Detect</option>
                <option value="en">English</option>
                <option value="id">Indonesian</option>
                <option value="ar">Arabic</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </SelectInput>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Word Timestamps">
              <SelectInput value={getDeep(config, 'lyrics.transcription.wordTimestamps', 'auto')} onChange={v => updateConfig('lyrics.transcription.wordTimestamps', v)}>
                <option value="auto">Auto</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </SelectInput>
            </Field>
            <Field label="Confidence Threshold">
              <TextInput type="number" value={getDeep(config, 'lyrics.transcription.confidence', 0.7)} onChange={v => updateConfig('lyrics.transcription.confidence', v)} placeholder="0.0-1.0" />
            </Field>
          </div>
          <Check label="Remove filler words (um, uh, etc)" checked={Boolean(getDeep(config, 'lyrics.transcription.removeFiller', true))} onChange={v => updateConfig('lyrics.transcription.removeFiller', v)} />
          <Check label="Auto-punctuation" checked={Boolean(getDeep(config, 'lyrics.transcription.autoPunctuation', true))} onChange={v => updateConfig('lyrics.transcription.autoPunctuation', v)} />
          <div className="flex gap-2">
            <button onClick={async () => {
              setBusy(true); setMessage('Transcribing audio...');
              try {
                const data = await api('/api/lyrics/transcribe', { 
                  method: 'POST', 
                  body: JSON.stringify({ 
                    audio: getDeep(config, 'input.audio'),
                    engine: getDeep(config, 'lyrics.transcription.engine'),
                    modelSize: getDeep(config, 'lyrics.transcription.modelSize'),
                    language: getDeep(config, 'lyrics.transcription.language'),
                    config 
                  }) 
                });
                setText(data.text || '');
                setParsed(data.segments || []);
                setMessage(`Transcribed: ${data.segments?.length || 0} segments, confidence: ${(data.confidence * 100).toFixed(1)}%`);
              } catch (e: any) { setMessage(e.message); }
              finally { setBusy(false); }
            }} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🎤 Transcribe Audio
            </button>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 AI Transcription menggunakan speech-to-text untuk generate lirik otomatis dari audio. Whisper Local tidak perlu API key.
          </div>
        </div>

        {/* Mesin Lirik */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Mesin Lirik</h3>
          <Check label="Aktifkan Lirik" checked={Boolean(getDeep(config, 'lyrics.enabled', true))} onChange={v => updateConfig('lyrics.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mode"><SelectInput value={getDeep(config, 'lyrics.autoMode', 'from-text')} onChange={v => updateConfig('lyrics.autoMode', v)}><option value="from-text">Dari teks manual</option><option value="from-file">Dari file LRC/SRT</option><option value="auto-align">Auto align durasi</option></SelectInput></Field>
            <Field label="AI Mode"><SelectInput value={getDeep(config, 'lyrics.ai', 'Mati')} onChange={v => updateConfig('lyrics.ai', v)}><option value="Mati">Mati / lokal</option><option value="prepare">Siapkan transkrip</option><option value="manual-review">Tinjau manual</option></SelectInput></Field>
            <Field label="Bahasa"><SelectInput value={getDeep(config, 'lyrics.language', 'Auto')} onChange={v => updateConfig('lyrics.language', v)}><option>Auto</option><option>Indonesia</option><option>English</option><option>Arabic</option><option>Mixed</option></SelectInput></Field>
          </div>
          <Field label="File LRC/SRT"><PathInput value={getDeep(config, 'lyrics.file')} onChange={v => updateConfig('lyrics.file', v)} placeholder="C:/lirik/lagu.lrc atau .srt" filter="lyrics" /></Field>
          <Field label="Output Lirik"><PathInput value={getDeep(config, 'lyrics.outputFile', '')} onChange={v => updateConfig('lyrics.outputFile', v)} placeholder="Opsional: C:/hasil/lyrics.srt" kind="save" filter="lyrics" /></Field>
          <textarea className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[72px] px-3 py-2 resize-y font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50" value={text} onChange={e => setText(e.target.value)} placeholder="Tempel lirik polos atau LRC di sini. Auto align akan membagi timing mengikuti durasi audio." />
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={parseLyrics} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Parse</button>
            <button onClick={autoAlign} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Selaraskan</button>
            <button onClick={validateLyrics} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Cek</button>
            <button onClick={() => exportLyrics(getDeep(config, 'lyrics.exportFormat', 'srt'))} disabled={busy || !parsed.length} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Ekspor</button>
          </div>
          {message && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium', validation?.ok ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]')}>
              {cleanUiText(message)}
            </div>
          )}
          {validation?.warnings?.length ? (
            <div className="p-3 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
              <h4 className="text-[11px] font-bold text-[var(--accent-warning)] mb-2">⚠ Catatan lirik:</h4>
              <ul className="space-y-1.5">
                {validation.warnings.map((w: string, i: number) => (
                  <li key={i} className="text-[10px] text-[var(--text-primary)] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]">
                    {cleanUiText(w)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {validation?.quality && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              {[
                { label: 'Skor Kualitas', value: validation.quality.score, accent: true },
                { label: 'Beat Snap', value: validation.quality.metrics?.beats || validation.beats?.length || 0 },
                { label: 'Baris', value: validation.quality.metrics?.lines || parsed.length },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <span className="text-[10px] text-[var(--text-muted)] mb-1">{label}</span>
                  <span className={cn('text-[14px] font-bold', accent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]')}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Smart Sync & Waveform */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Smart Sync & Waveform</h3>
          <Check label="Enable Smart Sync" checked={Boolean(getDeep(config, 'lyrics.smartSync.enabled', false))} onChange={v => updateConfig('lyrics.smartSync.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sync Method">
              <SelectInput value={getDeep(config, 'lyrics.smartSync.method', 'waveform')} onChange={v => updateConfig('lyrics.smartSync.method', v)}>
                <option value="waveform">Waveform Analysis</option>
                <option value="beat">Beat Detection</option>
                <option value="vocal">Vocal Detection</option>
                <option value="hybrid">Hybrid (All)</option>
              </SelectInput>
            </Field>
            <Field label="Sensitivity">
              <SelectInput value={getDeep(config, 'lyrics.smartSync.sensitivity', 'medium')} onChange={v => updateConfig('lyrics.smartSync.sensitivity', v)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </SelectInput>
            </Field>
            <Field label="Snap Tolerance">
              <TextInput type="number" value={getDeep(config, 'lyrics.smartSync.snapTolerance', 0.15)} onChange={v => updateConfig('lyrics.smartSync.snapTolerance', v)} placeholder="0.05-0.5" />
            </Field>
          </div>
          <Check label="Show waveform visualization" checked={Boolean(getDeep(config, 'lyrics.smartSync.showWaveform', true))} onChange={v => updateConfig('lyrics.smartSync.showWaveform', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Waveform Color">
              <TextInput value={getDeep(config, 'lyrics.smartSync.waveformColor', '#3b82f6')} onChange={v => updateConfig('lyrics.smartSync.waveformColor', v)} />
            </Field>
            <Field label="Marker Color">
              <TextInput value={getDeep(config, 'lyrics.smartSync.markerColor', '#22c55e')} onChange={v => updateConfig('lyrics.smartSync.markerColor', v)} />
            </Field>
          </div>
          <Slider label="Waveform Height" value={Number(getDeep(config, 'lyrics.smartSync.waveformHeight', 80))} onChange={v => updateConfig('lyrics.smartSync.waveformHeight', v)} min={40} max={200} />
          <Check label="Auto-adjust timing on sync" checked={Boolean(getDeep(config, 'lyrics.smartSync.autoAdjust', true))} onChange={v => updateConfig('lyrics.smartSync.autoAdjust', v)} />
          <div className="flex gap-2">
            <button onClick={async () => {
              setBusy(true); setMessage('Analyzing waveform...');
              try {
                const data = await api('/api/lyrics/smart-sync', { 
                  method: 'POST', 
                  body: JSON.stringify({ 
                    audio: getDeep(config, 'input.audio'),
                    lines: parsed,
                    method: getDeep(config, 'lyrics.smartSync.method'),
                    sensitivity: getDeep(config, 'lyrics.smartSync.sensitivity'),
                    config 
                  }) 
                });
                setParsed(data.syncedLines || []);
                setMessage(`Smart sync complete: ${data.syncedLines?.length || 0} lines synced, accuracy: ${(data.accuracy * 100).toFixed(1)}%`);
              } catch (e: any) { setMessage(e.message); }
              finally { setBusy(false); }
            }} disabled={busy || !parsed.length} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🎯 Smart Sync
            </button>
            <button onClick={() => {
              // Reset to original timing
              setMessage('Timing reset to original');
            }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">
              ↺ Reset
            </button>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Smart Sync menganalisis waveform audio untuk sinkronisasi timing lirik yang lebih akurat. Gunakan Hybrid untuk hasil terbaik.
          </div>
        </div>

        {/* Multi-Language Detection */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Multi-Language Detection</h3>
          <Check label="Enable Language Detection" checked={Boolean(getDeep(config, 'lyrics.multiLang.enabled', false))} onChange={v => updateConfig('lyrics.multiLang.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Detection Mode">
              <SelectInput value={getDeep(config, 'lyrics.multiLang.mode', 'auto')} onChange={v => updateConfig('lyrics.multiLang.mode', v)}>
                <option value="auto">Auto-Detect</option>
                <option value="manual">Manual Select</option>
                <option value="mixed">Mixed Languages</option>
              </SelectInput>
            </Field>
            <Field label="Primary Language">
              <SelectInput value={getDeep(config, 'lyrics.multiLang.primary', 'en')} onChange={v => updateConfig('lyrics.multiLang.primary', v)}>
                <option value="en">English</option>
                <option value="id">Indonesian</option>
                <option value="ar">Arabic</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </SelectInput>
            </Field>
            <Field label="Secondary Language">
              <SelectInput value={getDeep(config, 'lyrics.multiLang.secondary', 'none')} onChange={v => updateConfig('lyrics.multiLang.secondary', v)}>
                <option value="none">None</option>
                <option value="en">English</option>
                <option value="id">Indonesian</option>
                <option value="ar">Arabic</option>
                <option value="es">Spanish</option>
              </SelectInput>
            </Field>
          </div>
          <Check label="Enable Transliteration" checked={Boolean(getDeep(config, 'lyrics.multiLang.transliteration', false))} onChange={v => updateConfig('lyrics.multiLang.transliteration', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Transliteration Style">
              <SelectInput value={getDeep(config, 'lyrics.multiLang.translitStyle', 'romanized')} onChange={v => updateConfig('lyrics.multiLang.translitStyle', v)}>
                <option value="romanized">Romanized</option>
                <option value="phonetic">Phonetic</option>
                <option value="native">Native Script</option>
              </SelectInput>
            </Field>
            <Field label="Display Mode">
              <SelectInput value={getDeep(config, 'lyrics.multiLang.displayMode', 'original')} onChange={v => updateConfig('lyrics.multiLang.displayMode', v)}>
                <option value="original">Original Only</option>
                <option value="transliterated">Transliterated Only</option>
                <option value="both">Both (Dual Line)</option>
              </SelectInput>
            </Field>
          </div>
          <Check label="Auto-translate to English" checked={Boolean(getDeep(config, 'lyrics.multiLang.autoTranslate', false))} onChange={v => updateConfig('lyrics.multiLang.autoTranslate', v)} />
          <div className="flex gap-2">
            <button onClick={async () => {
              setBusy(true); setMessage('Detecting language...');
              try {
                const data = await api('/api/lyrics/detect-language', { 
                  method: 'POST', 
                  body: JSON.stringify({ 
                    text,
                    lines: parsed,
                    config 
                  }) 
                });
                updateConfig('lyrics.multiLang.primary', data.detectedLanguage);
                setMessage(`Detected: ${data.languageName} (${(data.confidence * 100).toFixed(1)}% confidence)`);
              } catch (e: any) { setMessage(e.message); }
              finally { setBusy(false); }
            }} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🌐 Detect Language
            </button>
            <button onClick={async () => {
              setBusy(true); setMessage('Transliterating...');
              try {
                const data = await api('/api/lyrics/transliterate', { 
                  method: 'POST', 
                  body: JSON.stringify({ 
                    text,
                    from: getDeep(config, 'lyrics.multiLang.primary'),
                    style: getDeep(config, 'lyrics.multiLang.translitStyle'),
                    config 
                  }) 
                });
                setText(data.transliterated || '');
                setMessage('Transliteration complete');
              } catch (e: any) { setMessage(e.message); }
              finally { setBusy(false); }
            }} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🔤 Transliterate
            </button>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Multi-Language Detection otomatis mendeteksi bahasa lirik dan dapat melakukan transliterasi (misal: Arab → Latin, Jepang → Romaji).
          </div>
        </div>

        {/* Timing & Output */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Timing & Output</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Format Output"><SelectInput value={getDeep(config, 'lyrics.exportFormat', 'srt')} onChange={v => updateConfig('lyrics.exportFormat', v)}><option value="srt">SRT</option><option value="lrc">LRC</option><option value="vtt">VTT</option></SelectInput></Field>
            <Field label="Durasi Baris"><TextInput type="number" value={getDeep(config, 'lyrics.lineDuration', 3)} onChange={v => updateConfig('lyrics.lineDuration', v)} /></Field>
            <Field label="Offset Detik"><TextInput type="number" value={getDeep(config, 'lyrics.offset', 0)} onChange={v => updateConfig('lyrics.offset', v)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Lead In"><TextInput type="number" value={getDeep(config, 'lyrics.leadIn', 0.15)} onChange={v => updateConfig('lyrics.leadIn', v)} /></Field>
            <Field label="Maks Karakter"><TextInput type="number" value={getDeep(config, 'lyrics.maxChars', 42)} onChange={v => updateConfig('lyrics.maxChars', v)} /></Field>
            <Field label="Model"><SelectInput value={getDeep(config, 'lyrics.model', 'Cepat')} onChange={v => updateConfig('lyrics.model', v)}><option>Cepat</option><option>Akurat</option><option>Karaoke</option></SelectInput></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Durasi Min"><TextInput type="number" value={getDeep(config, 'lyrics.minLineDuration', 1.1)} onChange={v => updateConfig('lyrics.minLineDuration', v)} /></Field>
            <Field label="Durasi Maks"><TextInput type="number" value={getDeep(config, 'lyrics.maxLineDuration', 5)} onChange={v => updateConfig('lyrics.maxLineDuration', v)} /></Field>
            <Field label="Batas Kualitas"><TextInput type="number" value={getDeep(config, 'lyrics.qualityGate', 82)} onChange={v => updateConfig('lyrics.qualityGate', v)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><input type="checkbox" className="accent-[var(--accent-primary)]" checked={Boolean(getDeep(config, 'lyrics.smartTiming', true))} onChange={e => updateConfig('lyrics.smartTiming', e.target.checked)} /> Smart timing berbobot</label>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><input type="checkbox" className="accent-[var(--accent-primary)]" checked={Boolean(getDeep(config, 'lyrics.beatSnap', true))} onChange={e => updateConfig('lyrics.beatSnap', e.target.checked)} /> Beat snap</label>
            <Field label="Jendela Snap"><TextInput type="number" value={getDeep(config, 'lyrics.beatSnapWindow', 0.22)} onChange={v => updateConfig('lyrics.beatSnapWindow', v)} /></Field>
          </div>
          <Check label="Auto save hasil export" checked={Boolean(getDeep(config, 'lyrics.autoSave', true))} onChange={v => updateConfig('lyrics.autoSave', v)} />
        </div>

        {/* Style Lirik */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Style Lirik</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Preset Gaya"><SelectInput value={getDeep(config, 'lyrics.stylePreset', 'modern')} onChange={applyLyricPreset}><option value="modern">Modern Clean</option><option value="karaoke">Karaoke Highlight</option><option value="shorts-bold">Shorts Bold</option><option value="minimal">Minimal Subtitle</option></SelectInput></Field>
            <Field label="Font"><TextInput value={getDeep(config, 'lyrics.font', 'Arial')} onChange={v => updateConfig('lyrics.font', v)} /></Field>
            <Field label="Posisi"><SelectInput value={getDeep(config, 'lyrics.position', 'Bawah')} onChange={v => updateConfig('lyrics.position', v)}><option>Bawah</option><option>Tengah</option><option>Atas</option></SelectInput></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Perataan"><SelectInput value={getDeep(config, 'lyrics.align', 'Rata Tengah')} onChange={v => updateConfig('lyrics.align', v)}><option>Rata Tengah</option><option>Rata Kiri</option><option>Rata Kanan</option></SelectInput></Field>
            <Field label="Warna"><TextInput value={getDeep(config, 'lyrics.color', '#ffffff')} onChange={v => updateConfig('lyrics.color', v)} /></Field>
            <Field label="Warna Highlight"><TextInput value={getDeep(config, 'lyrics.highlightColor', '#22c55e')} onChange={v => updateConfig('lyrics.highlightColor', v)} /></Field>
          </div>
          <Slider label="Skala" value={Number(getDeep(config, 'lyrics.scale', 28))} onChange={v => updateConfig('lyrics.scale', v)} min={16} max={60} />
          <Slider label="Outline" value={Number(getDeep(config, 'lyrics.outline', 2))} onChange={v => updateConfig('lyrics.outline', v)} min={0} max={6} />
          <Slider label="Shadow" value={Number(getDeep(config, 'lyrics.shadow', 1))} onChange={v => updateConfig('lyrics.shadow', v)} min={0} max={5} />
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><input type="checkbox" className="accent-[var(--accent-primary)]" checked={Boolean(getDeep(config, 'lyrics.karaoke', false))} onChange={e => updateConfig('lyrics.karaoke', e.target.checked)} /> Karaoke</label>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><input type="checkbox" className="accent-[var(--accent-primary)]" checked={Boolean(getDeep(config, 'lyrics.wordByWord', false))} onChange={e => updateConfig('lyrics.wordByWord', e.target.checked)} /> Word-by-word</label>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]"><input type="checkbox" className="accent-[var(--accent-primary)]" checked={Boolean(getDeep(config, 'lyrics.uppercase', false))} onChange={e => updateConfig('lyrics.uppercase', e.target.checked)} /> Uppercase</label>
          </div>
          <Check label="Area Aman subtitle" checked={Boolean(getDeep(config, 'lyrics.safeArea', true))} onChange={v => updateConfig('lyrics.safeArea', v)} />
        </div>

        {/* Pratinjau Timeline */}
        {!!previewRows.length && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Pratinjau Timeline</h3>
            <div className="flex flex-col gap-1">
              {previewRows.map((r, i) => (
                <div key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 text-[10px] px-2 py-1.5 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
                  <b className="text-[var(--accent-primary)] font-mono">{Number(r.time || 0).toFixed(2)}s</b>
                  <span className="text-[var(--text-primary)]">{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-Time Preview */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Real-Time Preview</h3>
          <Check label="Enable Real-Time Preview" checked={Boolean(getDeep(config, 'lyrics.preview.enabled', false))} onChange={v => updateConfig('lyrics.preview.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Preview Mode">
              <SelectInput value={getDeep(config, 'lyrics.preview.mode', 'audio-sync')} onChange={v => updateConfig('lyrics.preview.mode', v)}>
                <option value="audio-sync">Audio Sync</option>
                <option value="manual">Manual Scrub</option>
                <option value="auto-play">Auto Play</option>
              </SelectInput>
            </Field>
            <Field label="Playback Speed">
              <SelectInput value={getDeep(config, 'lyrics.preview.speed', '1.0')} onChange={v => updateConfig('lyrics.preview.speed', v)}>
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1.0">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </SelectInput>
            </Field>
            <Field label="Loop Mode">
              <SelectInput value={getDeep(config, 'lyrics.preview.loop', 'none')} onChange={v => updateConfig('lyrics.preview.loop', v)}>
                <option value="none">No Loop</option>
                <option value="current">Current Line</option>
                <option value="all">All Lines</option>
              </SelectInput>
            </Field>
          </div>
          <Check label="Show timing markers" checked={Boolean(getDeep(config, 'lyrics.preview.showMarkers', true))} onChange={v => updateConfig('lyrics.preview.showMarkers', v)} />
          <Check label="Highlight current line" checked={Boolean(getDeep(config, 'lyrics.preview.highlightCurrent', true))} onChange={v => updateConfig('lyrics.preview.highlightCurrent', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preview Font Size">
              <TextInput type="number" value={getDeep(config, 'lyrics.preview.fontSize', 16)} onChange={v => updateConfig('lyrics.preview.fontSize', v)} placeholder="12-24" />
            </Field>
            <Field label="Lines to Show">
              <TextInput type="number" value={getDeep(config, 'lyrics.preview.linesToShow', 5)} onChange={v => updateConfig('lyrics.preview.linesToShow', v)} placeholder="3-10" />
            </Field>
          </div>
          
          {/* Audio Player Controls */}
          <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Audio Player</h4>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                // Play/Pause logic
                setMessage('Audio playback started');
              }} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 rounded-[var(--radius-md)] transition-all duration-200">
                ▶ Play
              </button>
              <button onClick={() => {
                // Pause logic
                setMessage('Audio paused');
              }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">
                ⏸ Pause
              </button>
              <button onClick={() => {
                // Stop logic
                setMessage('Audio stopped');
              }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">
                ⏹ Stop
              </button>
              <div className="flex-1 mx-2">
                <input type="range" min="0" max="100" value="0" className="w-full accent-[var(--accent-primary)]" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">00:00 / 00:00</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
              <span>🎵 Current: Line 0 / {parsed.length}</span>
              <span className="ml-auto">Volume: 100%</span>
            </div>
          </div>

          {/* Live Preview Display */}
          <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] min-h-[120px]">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">Live Preview</h4>
            <div className="space-y-1">
              {previewRows.slice(0, Number(getDeep(config, 'lyrics.preview.linesToShow', 5))).map((r, i) => (
                <div key={i} className={cn(
                  'px-2 py-1 rounded text-[12px] transition-all duration-200',
                  i === 0 && getDeep(config, 'lyrics.preview.highlightCurrent') 
                    ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold' 
                    : 'text-[var(--text-muted)]'
                )}>
                  {getDeep(config, 'lyrics.preview.showMarkers') && (
                    <span className="text-[10px] font-mono mr-2">[{Number(r.time || 0).toFixed(2)}s]</span>
                  )}
                  {r.text}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={async () => {
              setBusy(true); setMessage('Loading audio for preview...');
              try {
                const data = await api('/api/lyrics/load-preview', { 
                  method: 'POST', 
                  body: JSON.stringify({ 
                    audio: getDeep(config, 'input.audio'),
                    lines: parsed,
                    config 
                  }) 
                });
                setMessage(`Preview ready: ${data.duration}s audio loaded`);
              } catch (e: any) { setMessage(e.message); }
              finally { setBusy(false); }
            }} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🎧 Load Preview
            </button>
            <button onClick={() => {
              // Jump to specific line
              setMessage('Jumped to selected line');
            }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">
              ⏭ Jump to Line
            </button>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Real-Time Preview memungkinkan Anda mendengar audio sambil melihat lirik tersinkronisasi. Gunakan untuk fine-tune timing.
          </div>
        </div>

        {/* Ekspor Pratinjau */}
        {outputPreview && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Ekspor Pratinjau</h3>
            <pre className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-primary)] p-3 max-h-[200px] overflow-auto whitespace-pre-wrap font-mono">{outputPreview.slice(0, 1600)}</pre>
          </div>
        )}
      </div>
    </aside>
  );
}
