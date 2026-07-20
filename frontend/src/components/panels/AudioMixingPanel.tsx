import { useState } from 'react';
import { Field, Check, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { WaveformDisplay, WaveformSkeleton } from '../ui/WaveformDisplay';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';
import { Callout, Card, SliderControl } from '../ui/design-system-components';

export function AudioMixingPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [introText, setIntroText] = useState((getDeep(config, 'audio.introSongs', []) || []).join('\n'));
  const [slotText, setSlotText] = useState((getDeep(config, 'audio.songs', []) || []).join('\n'));
  const [stemsText, setStemsText] = useState((getDeep(config, 'audio.stems', []) || []).map((x: any) => `${x.name || 'track'}|${x.file || ''}|${x.volume ?? 100}|${x.pan ?? 0}`).join('\n'));
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  
  async function previewAudio() {
    setPreviewing(true);
    setMessage('Generating 10s audio preview...');
    try {
      const data = await api('/api/audio/preview', { 
        method: 'POST', 
        body: JSON.stringify({ config, duration: 10 }) 
      });
      if (data.url) {
        setPreviewUrl(data.url);
        setMessage('Preview ready! Click play to listen.');
      }
    } catch (e: any) {
      setMessage(`Preview error: ${e.message}`);
    } finally {
      setPreviewing(false);
    }
  }
  
  function toggleStemSolo(index: number) {
    const stems = getDeep(config, 'audio.stems', []);
    const updated = stems.map((s: any, i: number) => ({ ...s, solo: i === index ? !s.solo : s.solo }));
    updateConfig('audio.stems', updated);
  }
  
  function toggleStemMute(index: number) {
    const stems = getDeep(config, 'audio.stems', []);
    const updated = stems.map((s: any, i: number) => ({ ...s, mute: i === index ? !s.mute : s.mute }));
    updateConfig('audio.stems', updated);
  }
  
  function updateStemVolume(index: number, volume: number) {
    const stems = getDeep(config, 'audio.stems', []);
    const updated = stems.map((s: any, i: number) => i === index ? { ...s, volume } : s);
    updateConfig('audio.stems', updated);
  }
  
  /* function _updateStemPan(index: number, pan: number) {
    const stems = getDeep(config, 'audio.stems', []);
    const updated = stems.map((s: any, i: number) => i === index ? { ...s, pan } : s);
    updateConfig('audio.stems', updated);
  } */
  async function validateAudio() {
    setBusy(true); setMessage('Validasi audio + loudness + waveform...');
    try {
      const data = await api('/api/audio/validate', { method: 'POST', body: JSON.stringify({ config, withWaveform: true }) });
      setValidation(data); setAnalysis(data);
      setMessage(data.ok ? `Audio siap. LUFS ${data.loudness?.integratedLufs ?? '-'} / Peak ${data.loudness?.truePeak ?? '-'} / Beat ${data.beats?.length || 0}` : `Perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function analyzeAudio() {
    setBusy(true); setMessage('Analisis audio utama...');
    try {
      const data = await api('/api/audio/analyze', { method: 'POST', body: JSON.stringify({ file: getDeep(config, 'input.audio'), config, seconds: 60, buckets: 180 }) });
      setAnalysis(data);
      setMessage(`Analisis selesai. LUFS ${data.loudness?.integratedLufs ?? '-'} • Peak ${data.loudness?.truePeak ?? '-'} • Beat ${data.beats?.length || 0}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  function applyPreset(v: string) {
    updateConfig('audio.platformPreset', v);
    if (v === 'youtube-music' || v === 'youtube-clean') { updateConfig('audio.normalize', true); updateConfig('audio.limiter', true); updateConfig('audio.compressor', true); updateConfig('audio.audioBitrate', '256k'); updateConfig('audio.bgmVolume', 100); updateConfig('audio.masterGain', 100); updateConfig('audio.bassGain', 1); updateConfig('audio.trebleGain', 1); }
    if (v === 'youtube-shorts') { updateConfig('audio.normalize', true); updateConfig('audio.limiter', true); updateConfig('audio.compressor', true); updateConfig('audio.audioBitrate', '192k'); updateConfig('audio.masterGain', 108); updateConfig('audio.bassGain', 2); updateConfig('audio.trebleGain', 2); updateConfig('audio.reactiveFx', 'Beat Flash'); }
    if (v === 'tiktok-loud' || v === 'loud') { updateConfig('audio.normalize', true); updateConfig('audio.limiter', true); updateConfig('audio.compressor', true); updateConfig('audio.masterGain', 115); updateConfig('audio.bassGain', 3); updateConfig('audio.trebleGain', 2); }
    if (v === 'podcast-clean') { updateConfig('audio.normalize', true); updateConfig('audio.limiter', true); updateConfig('audio.compressor', true); updateConfig('audio.highPass', 80); updateConfig('audio.lowPass', 12000); updateConfig('audio.noiseGate', true); updateConfig('audio.reactiveFx', 'Mati'); }
    if (v === 'background-soft' || v === 'soft') { updateConfig('audio.normalize', true); updateConfig('audio.limiter', true); updateConfig('audio.masterGain', 85); updateConfig('audio.bassGain', -1); updateConfig('audio.trebleGain', -1); updateConfig('audio.reactiveFx', 'Mati'); }
    if (v === 'cinematic-bass' || v === 'bass') { updateConfig('audio.normalize', true); updateConfig('audio.limiter', true); updateConfig('audio.compressor', true); updateConfig('audio.bassGain', 5); updateConfig('audio.midGain', -1); updateConfig('audio.trebleGain', 1); updateConfig('audio.masterGain', 105); }
  }
  function commitIntro() { updateConfig('audio.introSongs', introText.split(/\r?\n/).map((x: string) => x.trim()).filter(Boolean)); }
  function commitSlots() { updateConfig('audio.songs', slotText.split(/\r?\n/).map((x: string) => x.trim()).filter(Boolean)); }
  function commitStems() { updateConfig('audio.stems', stemsText.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean).map((line: string) => { const [name, file, volume, pan] = line.split('|').map((x: string) => x?.trim()); return { name: name || 'track', file: file || '', volume: Number(volume || 100), pan: Number(pan || 0) }; }).filter((x: any) => x.file)); }
  const peaks = analysis?.waveform?.peaks || validation?.waveform?.peaks || [];
  const loud = analysis?.loudness || validation?.loudness;
  const beats = analysis?.beats || validation?.beats || [];
  return (<div className="space-y-4">
        {/* Audio Stats with Loudness Metering */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <div className="space-y-3">
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] text-[var(--text-muted)] mb-1">MASTER</span>
              <span className="text-[16px] font-bold text-[var(--accent-primary)]">{getDeep(config, 'audio.masterGain', 100)}%</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] text-[var(--text-muted)] mb-1">LUFS</span>
              <span className="text-[16px] font-bold text-[var(--text-primary)]">{loud?.integratedLufs ?? '-'}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] text-[var(--text-muted)] mb-1">PEAK</span>
              <span className="text-[16px] font-bold text-[var(--text-primary)]">{loud?.truePeak ?? '-'}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[11px] text-[var(--text-muted)] mb-1">Beat</span>
              <span className="text-[16px] font-bold text-[var(--text-primary)]">{beats?.length || 0}</span>
            </div>
          </div>
          
          {/* Loudness Meter Visual */}
          {loud?.integratedLufs && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Loudness Meter</span>
                <span className={cn(
                  'font-semibold',
                  loud.integratedLufs < -23 ? 'text-[var(--accent-danger)]' : 
                  loud.integratedLufs < -16 ? 'text-[var(--accent-warning)]' : 
                  loud.integratedLufs < -10 ? 'text-[var(--accent-success)]' : 
                  'text-[var(--accent-danger)]'
                )}>
                  {loud.integratedLufs < -23 ? '⚠ Too Quiet' : 
                   loud.integratedLufs < -16 ? '✓ Good' : 
                   loud.integratedLufs < -10 ? '✓ Optimal' : 
                   '⚠ Too Loud'}
                </span>
              </div>
              <div className="relative h-3 bg-[var(--tertiary-bg)] rounded-full overflow-hidden">
                {/* Background gradient zones */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-red-500/20" style={{maxWidth: '20%'}} />
                  <div className="flex-1 bg-yellow-500/20" style={{maxWidth: '30%'}} />
                  <div className="flex-1 bg-green-500/20" style={{maxWidth: '30%'}} />
                  <div className="flex-1 bg-red-500/20" style={{maxWidth: '20%'}} />
                </div>
                {/* LUFS indicator */}
                <div 
                  className={cn(
                    'absolute top-0 left-0 h-full transition-all duration-300',
                    loud.integratedLufs < -23 ? 'bg-red-500' : 
                    loud.integratedLufs < -16 ? 'bg-yellow-500' : 
                    loud.integratedLufs < -10 ? 'bg-green-500' : 
                    'bg-red-500'
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, ((loud.integratedLufs + 40) / 40) * 100))}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                <span>-40 LUFS</span>
                <span>-23</span>
                <span>-16</span>
                <span>-10</span>
                <span>0 LUFS</span>
              </div>
            </div>
          )}
          
          {/* Peak Meter Visual */}
          {loud?.truePeak && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Peak Level</span>
                <span className={cn(
                  'font-semibold',
                  loud.truePeak > -1 ? 'text-[var(--accent-danger)]' : 
                  loud.truePeak > -3 ? 'text-[var(--accent-warning)]' : 
                  'text-[var(--accent-success)]'
                )}>
                  {loud.truePeak > -1 ? '⚠ Clipping Risk' : 
                   loud.truePeak > -3 ? '⚠ High' : 
                   '✓ Safe'}
                </span>
              </div>
              <div className="relative h-2 bg-[var(--tertiary-bg)] rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'absolute top-0 left-0 h-full transition-all duration-300',
                    loud.truePeak > -1 ? 'bg-red-500' : 
                    loud.truePeak > -3 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, ((loud.truePeak + 40) / 40) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Preset & Cek Aman */}
        <Card title="Preset & Cek Aman">
          <div className="space-y-3">
            <Field label="Preset Platform"><SelectInput value={getDeep(config, 'audio.platformPreset', 'custom')} onChange={applyPreset}><option value="custom">Kustom</option><option value="youtube-music">YouTube Music</option><option value="youtube-shorts">YouTube Shorts</option><option value="tiktok-loud">TikTok Kencang</option><option value="podcast-clean">Podcast Bersih</option><option value="background-soft">Latar Lembut</option><option value="cinematic-bass">Bass Sinematik</option></SelectInput></Field>
            <Field label="Mode Mix"><SelectInput value={getDeep(config, 'audio.mixMode', 'single')} onChange={v => updateConfig('audio.mixMode', v)}><option value="single">Audio tunggal</option><option value="playlist">Crossfade playlist</option><option value="ambient">Audio + ambience</option></SelectInput></Field>
            <Field label="Urutan"><SelectInput value={getDeep(config, 'audio.order', 'acak')} onChange={v => updateConfig('audio.order', v)}><option>acak</option><option>urut</option><option>acak unik</option></SelectInput></Field>
          </div>
          <div className="space-y-3">
            <button onClick={validateAudio} disabled={busy} className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Cek Audio</button>
            <button onClick={analyzeAudio} disabled={busy} className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Analisis Waveform</button>
            <button onClick={previewAudio} disabled={busy || previewing} className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-success)] hover:bg-[var(--accent-success)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">
              🎧 Preview 10s
            </button>
            <Field label="Auto Gain"><SelectInput value={getDeep(config, 'audio.autoGain', true) ? 'Aktif' : 'Mati'} onChange={v => updateConfig('audio.autoGain', v === 'Aktif')}><option value="Aktif">Aktif</option><option value="Mati">Mati</option></SelectInput></Field>
          </div>
          {previewUrl && (
            <div className="mt-2">
              <audio controls src={previewUrl} className="w-full h-8 rounded-[var(--radius-md)]" />
            </div>
          )}
          {message && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium', validation?.ok ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]')}>
              {cleanUiText(message)}
            </div>
          )}
          {validation?.warnings?.length ? (
            <div className="p-4 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
              <h4 className="text-[12px] font-bold text-[var(--accent-warning)] mb-3">⚠ Catatan audio:</h4>
              <ul className="space-y-2">
                {validation.warnings.map((w: string, i: number) => (
                  <li key={i} className="text-[11px] text-[var(--text-primary)] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]">
                    {cleanUiText(w)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {peaks.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Audio Waveform</span>
                <span className="text-[var(--text-primary)]">{peaks.length} samples</span>
              </div>
              <WaveformDisplay
                peaks={peaks}
                duration={analysis?.info?.duration || validation?.totalDuration || 0}
                height={60}
                color="#38bdf8"
                progressColor="#22c55e"
                backgroundColor="var(--tertiary-bg)"
                className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)]"
              />
            </div>
          ) : busy ? (
            <WaveformSkeleton height={60} className="rounded-[var(--radius-md)]" />
          ) : (
            <div className="flex items-end gap-px px-3 py-2 h-[48px] bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
              {peaks.slice(0, 120).map((p: number, i: number) => (
                <i key={i} className="w-[3px] min-h-[3px] rounded-t bg-[var(--accent-primary)]" style={{height: `${Math.max(3, p * 54)}px`}} />
              ))}
            </div>
          )}
        </Card>
        {/* Volume & Mastering */}
        <Card title="Volume & Mastering">
          <SliderControl label="Volume Video" value={Number(getDeep(config, 'audio.videoVolume', 0))} onChange={v => updateConfig('audio.videoVolume', v)} min={0} max={150} />
          <SliderControl label="Volume Audio/BGM" value={Number(getDeep(config, 'audio.bgmVolume', 100))} onChange={v => updateConfig('audio.bgmVolume', v)} min={0} max={150} />
          <SliderControl label="Penguatan Master" value={Number(getDeep(config, 'audio.masterGain', 100))} onChange={v => updateConfig('audio.masterGain', v)} min={0} max={150} />
          <div className="space-y-3">
            <Field label="Bitrate Audio"><SelectInput value={getDeep(config, 'audio.audioBitrate', '192k')} onChange={v => updateConfig('audio.audioBitrate', v)}><option>128k</option><option>192k</option><option>256k</option><option>320k</option></SelectInput></Field>
            <Field label="Fade Masuk"><TextInput type="number" value={getDeep(config, 'audio.fadeIn', 0.6)} onChange={v => updateConfig('audio.fadeIn', v)} /></Field>
            <Field label="Fade Keluar"><TextInput type="number" value={getDeep(config, 'audio.fadeOut', 1.2)} onChange={v => updateConfig('audio.fadeOut', v)} /></Field>
          </div>
          <Check label="Normalize loudness (-14 LUFS)" checked={Boolean(getDeep(config, 'audio.normalize', true))} onChange={v => updateConfig('audio.normalize', v)} />
          <Check label="Limiter anti pecah" checked={Boolean(getDeep(config, 'audio.limiter', true))} onChange={v => updateConfig('audio.limiter', v)} />
        </Card>

        {/* Audio Sync & Format */}
        <Card title="Audio Sync & Format">
          <div className="space-y-3">
            <Field label="Audio Offset (ms)">
              <TextInput 
                type="number" 
                value={getDeep(config, 'audio.syncOffset', 0)} 
                onChange={v => updateConfig('audio.syncOffset', v)}
                placeholder="-100 cepat, +100 delay"
              />
            </Field>
            <Field label="Trim Start (detik)">
              <TextInput 
                type="number" 
                value={getDeep(config, 'audio.trimStart', 0)} 
                onChange={v => updateConfig('audio.trimStart', v)}
                placeholder="0"
              />
            </Field>
            <Field label="Trim End (detik)">
              <TextInput 
                type="number" 
                value={getDeep(config, 'audio.trimEnd', 0)} 
                onChange={v => updateConfig('audio.trimEnd', v)}
                placeholder="0"
              />
            </Field>
          </div>
          <div className="space-y-3">
            <Field label="Sample Rate">
              <SelectInput 
                value={getDeep(config, 'audio.sampleRate', '48000')} 
                onChange={v => updateConfig('audio.sampleRate', v)}
              >
                <option value="44100">44.1 kHz (CD)</option>
                <option value="48000">48 kHz (Standard)</option>
                <option value="96000">96 kHz (Hi-Res)</option>
              </SelectInput>
            </Field>
            <Field label="Audio Codec">
              <SelectInput 
                value={getDeep(config, 'audio.codec', 'aac')} 
                onChange={v => updateConfig('audio.codec', v)}
              >
                <option value="aac">AAC (Recommended)</option>
                <option value="mp3">MP3 (Compatible)</option>
                <option value="opus">Opus (Efficient)</option>
                <option value="flac">FLAC (Lossless)</option>
              </SelectInput>
            </Field>
            <Field label="Stereo Width">
              <TextInput 
                type="number" 
                value={getDeep(config, 'audio.stereoWidth', 100)} 
                onChange={v => updateConfig('audio.stereoWidth', v)}
                placeholder="0-200%"
              />
            </Field>
          </div>
          <Check 
            label="Mono Compatibility Check" 
            checked={Boolean(getDeep(config, 'audio.monoCheck', false))} 
            onChange={v => updateConfig('audio.monoCheck', v)} 
          />
          <Callout type="tip">
            Gunakan offset untuk sinkronisasi audio-video. Stereo width: 0=Mono, 100=Normal, 200=Wide
          </Callout>
        </Card>

        {/* 5-Band Parametric EQ */}
        <Card title="5-Band Parametric EQ">
          <SliderControl label="Sub Bass (20-60Hz)" value={Number(getDeep(config, 'audio.subBassGain', 0))} onChange={v => updateConfig('audio.subBassGain', v)} min={-12} max={12} />
          <SliderControl label="Bass (60-250Hz)" value={Number(getDeep(config, 'audio.bassGain', 0))} onChange={v => updateConfig('audio.bassGain', v)} min={-12} max={12} />
          <SliderControl label="Low Mid (250Hz-2kHz)" value={Number(getDeep(config, 'audio.lowMidGain', 0))} onChange={v => updateConfig('audio.lowMidGain', v)} min={-12} max={12} />
          <SliderControl label="High Mid (2k-6kHz)" value={Number(getDeep(config, 'audio.highMidGain', 0))} onChange={v => updateConfig('audio.highMidGain', v)} min={-12} max={12} />
          <SliderControl label="Treble (6k-20kHz)" value={Number(getDeep(config, 'audio.trebleGain', 0))} onChange={v => updateConfig('audio.trebleGain', v)} min={-12} max={12} />
          <SliderControl label="Pan L/R" value={Number(getDeep(config, 'audio.pan', 0))} onChange={v => updateConfig('audio.pan', v)} min={-100} max={100} />
          <div className="space-y-3">
            <Field label="High-pass Hz"><TextInput type="number" value={getDeep(config, 'audio.highPass', 0)} onChange={v => updateConfig('audio.highPass', v)} /></Field>
            <Field label="Low-pass Hz"><TextInput type="number" value={getDeep(config, 'audio.lowPass', 0)} onChange={v => updateConfig('audio.lowPass', v)} /></Field>
            <Field label="Noise Gate Threshold"><TextInput type="number" value={getDeep(config, 'audio.noiseGateThreshold', -45)} onChange={v => updateConfig('audio.noiseGateThreshold', v)} /></Field>
          </div>
          <Check label="De-hum 50Hz ringan" checked={Boolean(getDeep(config, 'audio.deHum', false))} onChange={v => updateConfig('audio.deHum', v)} />
          <Check label="Noise gate" checked={Boolean(getDeep(config, 'audio.noiseGate', false))} onChange={v => updateConfig('audio.noiseGate', v)} />
          <Check label="Compressor" checked={Boolean(getDeep(config, 'audio.compressor', false))} onChange={v => updateConfig('audio.compressor', v)} />
          <div className="space-y-3">
            <Field label="Threshold (dB)"><TextInput type="number" value={getDeep(config, 'audio.compressorThreshold', -18)} onChange={v => updateConfig('audio.compressorThreshold', v)} /></Field>
            <Field label="Ratio"><TextInput type="number" value={getDeep(config, 'audio.compressorRatio', 3)} onChange={v => updateConfig('audio.compressorRatio', v)} /></Field>
            <Field label="Attack (ms)"><TextInput type="number" value={getDeep(config, 'audio.compressorAttack', 5)} onChange={v => updateConfig('audio.compressorAttack', v)} placeholder="1-100" /></Field>
          </div>
          <div className="space-y-3">
            <Field label="Release (ms)"><TextInput type="number" value={getDeep(config, 'audio.compressorRelease', 50)} onChange={v => updateConfig('audio.compressorRelease', v)} placeholder="10-1000" /></Field>
            <Field label="Knee (dB)"><TextInput type="number" value={getDeep(config, 'audio.compressorKnee', 2)} onChange={v => updateConfig('audio.compressorKnee', v)} placeholder="0-10" /></Field>
            <Field label="Makeup Gain (dB)"><TextInput type="number" value={getDeep(config, 'audio.compressorMakeup', 0)} onChange={v => updateConfig('audio.compressorMakeup', v)} placeholder="0-24" /></Field>
          </div>
          <div className="space-y-3">
            <Field label="Level Ducking %"><TextInput type="number" value={getDeep(config, 'audio.duckingLevel', 35)} onChange={v => updateConfig('audio.duckingLevel', v)} /></Field>
          </div>
          <Check label="Auto duck saat CTA/voice muncul" checked={Boolean(getDeep(config, 'audio.autoDuck', false))} onChange={v => updateConfig('audio.autoDuck', v)} />
        </Card>

        {/* Reverb & Delay Effects */}
        <Card title="Reverb & Delay Effects">
          <Check label="Enable Reverb" checked={Boolean(getDeep(config, 'audio.reverb', false))} onChange={v => updateConfig('audio.reverb', v)} />
          <SliderControl label="Reverb Amount" value={Number(getDeep(config, 'audio.reverbAmount', 20))} onChange={v => updateConfig('audio.reverbAmount', v)} min={0} max={100} />
          <div className="space-y-3">
            <Field label="Reverb Type">
              <SelectInput value={getDeep(config, 'audio.reverbType', 'room')} onChange={v => updateConfig('audio.reverbType', v)}>
                <option value="room">Room</option>
                <option value="hall">Hall</option>
                <option value="plate">Plate</option>
                <option value="spring">Spring</option>
              </SelectInput>
            </Field>
            <Field label="Reverb Size">
              <SelectInput value={getDeep(config, 'audio.reverbSize', 'medium')} onChange={v => updateConfig('audio.reverbSize', v)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </SelectInput>
            </Field>
          </div>
          <Check label="Enable Delay/Echo" checked={Boolean(getDeep(config, 'audio.delay', false))} onChange={v => updateConfig('audio.delay', v)} />
          <div className="space-y-3">
            <Field label="Delay Time (ms)">
              <TextInput type="number" value={getDeep(config, 'audio.delayTime', 250)} onChange={v => updateConfig('audio.delayTime', v)} placeholder="50-2000" />
            </Field>
            <Field label="Feedback %">
              <TextInput type="number" value={getDeep(config, 'audio.delayFeedback', 30)} onChange={v => updateConfig('audio.delayFeedback', v)} placeholder="0-90" />
            </Field>
            <Field label="Delay Mix %">
              <TextInput type="number" value={getDeep(config, 'audio.delayMix', 25)} onChange={v => updateConfig('audio.delayMix', v)} placeholder="0-100" />
            </Field>
          </div>
          <Callout type="tip">
            Reverb menambah ruang & kedalaman. Delay menciptakan echo. Gunakan dengan hati-hati untuk hasil natural.
          </Callout>
        </Card>

        {/* Ambient, Voice & FX */}
        <Card title="Ambient, Voice & FX">
          <Check label="ASM Mode (Ambient/BGM Loop)" checked={Boolean(getDeep(config, 'audio.asmMode', false))} onChange={v => updateConfig('audio.asmMode', v)} />
          <Field label="File Ambient"><PathInput value={getDeep(config, 'audio.ambientLoop', '')} onChange={v => updateConfig('audio.ambientLoop', v)} placeholder="C:/audio/ambient.mp3" filter="audio" /></Field>
          <SliderControl label="Vol Ambient" value={Number(getDeep(config, 'audio.ambientVolume', 15))} onChange={v => updateConfig('audio.ambientVolume', v)} min={0} max={100} />
          <Field label="Voice Track"><PathInput value={getDeep(config, 'audio.voiceTrack', '')} onChange={v => updateConfig('audio.voiceTrack', v)} filter="audio" /></Field>
          <SliderControl label="Volume Voice" value={Number(getDeep(config, 'audio.voiceVolume', 100))} onChange={v => updateConfig('audio.voiceVolume', v)} min={0} max={150} />
          <Field label="Effect Track"><PathInput value={getDeep(config, 'audio.effectTrack', '')} onChange={v => updateConfig('audio.effectTrack', v)} filter="audio" /></Field>
          <SliderControl label="Volume Efek" value={Number(getDeep(config, 'audio.effectVolume', 80))} onChange={v => updateConfig('audio.effectVolume', v)} min={0} max={150} />
        </Card>

        {/* Beat & Reactive FX */}
        <Card title="Beat & Reactive FX">
          <Check label="Beat detection nyata dari waveform" checked={Boolean(getDeep(config, 'audio.beatDetection', true))} onChange={v => updateConfig('audio.beatDetection', v)} />
          <Field label="Reactive FX"><SelectInput value={getDeep(config, 'audio.reactiveFx', 'Beat Flash')} onChange={v => updateConfig('audio.reactiveFx', v)}><option>Beat Flash</option><option>Logo Pulse</option><option>Background Jedug</option><option>Mati</option></SelectInput></Field>
          <SliderControl label="Strength" value={Number(getDeep(config, 'audio.reactiveStrength', 40))} onChange={v => updateConfig('audio.reactiveStrength', v)} min={0} max={100} />
          <Field label="Warna Flash"><SelectInput value={getDeep(config, 'audio.beatFlashColor', 'white')} onChange={v => updateConfig('audio.beatFlashColor', v)}><option>white</option><option>red</option><option>blue</option><option>yellow</option><option>cyan</option></SelectInput></Field>
        </Card>

        {/* Playlist & Stems */}
        <Card title="Playlist & Stems">
          <Field label="Lagu Intro"><textarea className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[42px] px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50" value={introText} onChange={e => setIntroText(e.target.value)} onBlur={commitIntro} placeholder="Satu path per baris" /></Field>
          <Field label="Slot Lagu"><textarea className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[42px] px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50" value={slotText} onChange={e => setSlotText(e.target.value)} onBlur={commitSlots} placeholder="Satu path per baris" /></Field>
          <Field label="Lagu Terakhir"><PathInput value={getDeep(config, 'audio.endingSong', '')} onChange={v => updateConfig('audio.endingSong', v)} filter="audio" /></Field>
          <div className="space-y-3">
            <Field label="Crossfade"><TextInput type="number" value={getDeep(config, 'audio.crossfade', 0.8)} onChange={v => updateConfig('audio.crossfade', v)} /></Field>
            <Field label="Jeda Sunyi"><TextInput type="number" value={getDeep(config, 'audio.silenceBetween', 0)} onChange={v => updateConfig('audio.silenceBetween', v)} /></Field>
            <Field label="Volume Akhir"><TextInput type="number" value={getDeep(config, 'audio.endingVolume', 100)} onChange={v => updateConfig('audio.endingVolume', v)} /></Field>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--text-primary)]">Stem Mixer</label>
              <button 
                onClick={() => {
                  const newStem = { name: 'track', file: '', volume: 100, pan: 0, solo: false, mute: false };
                  updateConfig('audio.stems', [...(getDeep(config, 'audio.stems', []) || []), newStem]);
                }}
                className="px-2 py-1 text-[10px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 rounded transition-all duration-200"
              >
                + Add Stem
              </button>
            </div>
            {(getDeep(config, 'audio.stems', []) || []).length > 0 ? (
              <div className="space-y-2">
                {(getDeep(config, 'audio.stems', []) || []).map((stem: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-[var(--text-primary)] truncate">{stem.name || `Track ${i + 1}`}</div>
                      <div className="text-[9px] text-[var(--text-muted)] truncate">{stem.file || 'No file'}</div>
                    </div>
                    <button 
                      onClick={() => toggleStemSolo(i)}
                      className={cn(
                        'px-2 py-1 text-[10px] font-bold rounded transition-all duration-200',
                        stem.solo 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : 'bg-[var(--secondary-bg)] text-[var(--text-muted)] hover:bg-[var(--tertiary-bg)]'
                      )}
                      title="Solo"
                    >
                      S
                    </button>
                    <button 
                      onClick={() => toggleStemMute(i)}
                      className={cn(
                        'px-2 py-1 text-[10px] font-bold rounded transition-all duration-200',
                        stem.mute 
                          ? 'bg-[var(--accent-danger)] text-white' 
                          : 'bg-[var(--secondary-bg)] text-[var(--text-muted)] hover:bg-[var(--tertiary-bg)]'
                      )}
                      title="Mute"
                    >
                      M
                    </button>
                    <div className="flex items-center gap-1 w-32">
                      <input 
                        type="range" 
                        min="0" 
                        max="150" 
                        value={stem.volume || 100}
                        onChange={e => updateStemVolume(i, Number(e.target.value))}
                        className="flex-1 h-1 bg-[var(--secondary-bg)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)] [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                      <span className="text-[9px] text-[var(--text-muted)] w-8 text-right">{stem.volume || 100}</span>
                    </div>
                    <button
                      onClick={() => {
                        const stems = getDeep(config, 'audio.stems', []);
                        updateConfig('audio.stems', stems.filter((_: any, idx: number) => idx !== i));
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded transition-all duration-200"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)] text-center">
                No stems added. Click "+ Add Stem" to start.
              </div>
            )}
            <details className="mt-2">
              <summary className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">Advanced: Text Editor</summary>
              <Field label=""><textarea className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[42px] px-2 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 mt-2" value={stemsText} onChange={e => setStemsText(e.target.value)} onBlur={commitStems} placeholder="Format: nama|path|volume|pan\nvocal|C:/vocal.wav|100|0" /></Field>
            </details>
          </div>
        </Card>

        {/* Audio Export Options */}
        <Card title="Audio Export Options">
          <Check 
            label="Export Audio Only (tanpa video)" 
            checked={Boolean(getDeep(config, 'audio.exportAudioOnly', false))} 
            onChange={v => updateConfig('audio.exportAudioOnly', v)} 
          />
          <div className="space-y-3">
            <Field label="Export Format">
              <SelectInput 
                value={getDeep(config, 'audio.exportFormat', 'mp3')} 
                onChange={v => updateConfig('audio.exportFormat', v)}
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="flac">FLAC</option>
                <option value="m4a">M4A/AAC</option>
                <option value="ogg">OGG Vorbis</option>
              </SelectInput>
            </Field>
            <Field label="Export Quality">
              <SelectInput 
                value={getDeep(config, 'audio.exportQuality', 'high')} 
                onChange={v => updateConfig('audio.exportQuality', v)}
              >
                <option value="low">Low (128k)</option>
                <option value="medium">Medium (192k)</option>
                <option value="high">High (256k)</option>
                <option value="highest">Highest (320k)</option>
              </SelectInput>
            </Field>
          </div>
          <Callout type="tip">
            Export audio only untuk mendapatkan file audio terpisah tanpa video. Berguna untuk podcast atau musik.
          </Callout>
        </Card>
      </div>);
}
