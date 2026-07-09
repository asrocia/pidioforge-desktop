import React, { useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, InfoBar, WarnBox } from '../ui/panel-primitives';
import { Field, Check, TextInput, SelectInput, Slider } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';

export function AudioMixingPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [introText, setIntroText] = useState((getDeep(config, 'audio.introSongs', []) || []).join('\n'));
  const [slotText, setSlotText] = useState((getDeep(config, 'audio.songs', []) || []).join('\n'));
  const [stemsText, setStemsText] = useState((getDeep(config, 'audio.stems', []) || []).map((x: any) => `${x.name || 'track'}|${x.file || ''}|${x.volume ?? 100}|${x.pan ?? 0}`).join('\n'));
  const [busy, setBusy] = useState(false);
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
  return <PanelWrap>
    <InfoBar>
      <span><b>MASTER </b>{getDeep(config, 'audio.masterGain', 100)}%</span>
      <span><b>LUFS </b>{loud?.integratedLufs ?? '-'}</span>
      <span><b>PEAK </b>{loud?.truePeak ?? '-'}</span>
      <span><b>Beat </b>{beats?.length || 0}</span>
    </InfoBar>
    <Group title="Preset & Cek Aman">
      <Grid3><Field label="Preset Platform"><SelectInput value={getDeep(config, 'audio.platformPreset', 'custom')} onChange={applyPreset}><option value="custom">Kustom</option><option value="youtube-music">YouTube Music</option><option value="youtube-shorts">YouTube Shorts</option><option value="tiktok-loud">TikTok Kencang</option><option value="podcast-clean">Podcast Bersih</option><option value="background-soft">Latar Lembut</option><option value="cinematic-bass">Bass Sinematik</option></SelectInput></Field><Field label="Mode Mix"><SelectInput value={getDeep(config, 'audio.mixMode', 'single')} onChange={v => updateConfig('audio.mixMode', v)}><option value="single">Audio tunggal</option><option value="playlist">Crossfade playlist</option><option value="ambient">Audio + ambience</option></SelectInput></Field><Field label="Urutan"><SelectInput value={getDeep(config, 'audio.order', 'acak')} onChange={v => updateConfig('audio.order', v)}><option>acak</option><option>urut</option><option>acak unik</option></SelectInput></Field></Grid3>
      <Grid3><ActionBtn onClick={validateAudio} disabled={busy}>Cek Audio</ActionBtn><ActionBtn onClick={analyzeAudio} disabled={busy}>Analisis Waveform</ActionBtn><Field label="Auto Gain"><SelectInput value={getDeep(config, 'audio.autoGain', true) ? 'Aktif' : 'Mati'} onChange={v => updateConfig('audio.autoGain', v === 'Aktif')}><option value="Aktif">Aktif</option><option value="Mati">Mati</option></SelectInput></Field></Grid3>
      {message && <InfoBar variant={validation?.ok ? 'ok' : 'error'}>{cleanUiText(message)}</InfoBar>}
      {validation?.warnings?.length ? <WarnBox title="Catatan audio:" items={validation.warnings.map((w: string) => cleanUiText(w))} /> : null}
      {!!peaks.length && <div className="flex items-end gap-px px-3 py-2 h-[48px]">{peaks.slice(0, 120).map((p: number, i: number) => <i key={i} className="w-[3px] min-h-[3px] rounded-t bg-[#4f8ef7]" style={{height: `${Math.max(3, p * 54)}px`}} />)}</div>}
    </Group>
    <Group title="Volume & Mastering">
      <Slider label="Volume Video" value={Number(getDeep(config, 'audio.videoVolume', 0))} onChange={v => updateConfig('audio.videoVolume', v)} min={0} max={150} />
      <Slider label="Volume Audio/BGM" value={Number(getDeep(config, 'audio.bgmVolume', 100))} onChange={v => updateConfig('audio.bgmVolume', v)} min={0} max={150} />
      <Slider label="Penguatan Master" value={Number(getDeep(config, 'audio.masterGain', 100))} onChange={v => updateConfig('audio.masterGain', v)} min={0} max={150} />
      <Grid3><Field label="Bitrate Audio"><SelectInput value={getDeep(config, 'audio.audioBitrate', '192k')} onChange={v => updateConfig('audio.audioBitrate', v)}><option>128k</option><option>192k</option><option>256k</option><option>320k</option></SelectInput></Field><Field label="Fade Masuk"><TextInput type="number" value={getDeep(config, 'audio.fadeIn', 0.6)} onChange={v => updateConfig('audio.fadeIn', v)} /></Field><Field label="Fade Keluar"><TextInput type="number" value={getDeep(config, 'audio.fadeOut', 1.2)} onChange={v => updateConfig('audio.fadeOut', v)} /></Field></Grid3>
      <Check label="Normalize loudness (-14 LUFS)" checked={Boolean(getDeep(config, 'audio.normalize', true))} onChange={v => updateConfig('audio.normalize', v)} />
      <Check label="Limiter anti pecah" checked={Boolean(getDeep(config, 'audio.limiter', true))} onChange={v => updateConfig('audio.limiter', v)} />
    </Group>
    <Group title="EQ & Compressor">
      <Slider label="Penguatan Bass" value={Number(getDeep(config, 'audio.bassGain', 0))} onChange={v => updateConfig('audio.bassGain', v)} min={-12} max={12} />
      <Slider label="Penguatan Mid" value={Number(getDeep(config, 'audio.midGain', 0))} onChange={v => updateConfig('audio.midGain', v)} min={-12} max={12} />
      <Slider label="Penguatan Treble" value={Number(getDeep(config, 'audio.trebleGain', 0))} onChange={v => updateConfig('audio.trebleGain', v)} min={-12} max={12} />
      <Slider label="Pan L/R" value={Number(getDeep(config, 'audio.pan', 0))} onChange={v => updateConfig('audio.pan', v)} min={-100} max={100} />
      <Grid3><Field label="High-pass Hz"><TextInput type="number" value={getDeep(config, 'audio.highPass', 0)} onChange={v => updateConfig('audio.highPass', v)} /></Field><Field label="Low-pass Hz"><TextInput type="number" value={getDeep(config, 'audio.lowPass', 0)} onChange={v => updateConfig('audio.lowPass', v)} /></Field><Field label="Noise Gate Threshold"><TextInput type="number" value={getDeep(config, 'audio.noiseGateThreshold', -45)} onChange={v => updateConfig('audio.noiseGateThreshold', v)} /></Field></Grid3>
      <Check label="De-hum 50Hz ringan" checked={Boolean(getDeep(config, 'audio.deHum', false))} onChange={v => updateConfig('audio.deHum', v)} />
      <Check label="Noise gate" checked={Boolean(getDeep(config, 'audio.noiseGate', false))} onChange={v => updateConfig('audio.noiseGate', v)} />
      <Check label="Compressor" checked={Boolean(getDeep(config, 'audio.compressor', false))} onChange={v => updateConfig('audio.compressor', v)} />
      <Grid3><Field label="Ambang"><TextInput type="number" value={getDeep(config, 'audio.compressorThreshold', -18)} onChange={v => updateConfig('audio.compressorThreshold', v)} /></Field><Field label="Rasio"><TextInput type="number" value={getDeep(config, 'audio.compressorRatio', 3)} onChange={v => updateConfig('audio.compressorRatio', v)} /></Field><Field label="Level Ducking %"><TextInput type="number" value={getDeep(config, 'audio.duckingLevel', 35)} onChange={v => updateConfig('audio.duckingLevel', v)} /></Field></Grid3>
      <Check label="Auto duck saat CTA/voice muncul" checked={Boolean(getDeep(config, 'audio.autoDuck', false))} onChange={v => updateConfig('audio.autoDuck', v)} />
    </Group>
    <Group title="Ambient, Voice & FX">
      <Check label="ASM Mode (Ambient/BGM Loop)" checked={Boolean(getDeep(config, 'audio.asmMode', false))} onChange={v => updateConfig('audio.asmMode', v)} />
      <Field label="File Ambient"><PathInput value={getDeep(config, 'audio.ambientLoop', '')} onChange={v => updateConfig('audio.ambientLoop', v)} placeholder="C:/audio/ambient.mp3" filter="audio" /></Field>
      <Slider label="Vol Ambient" value={Number(getDeep(config, 'audio.ambientVolume', 15))} onChange={v => updateConfig('audio.ambientVolume', v)} min={0} max={100} />
      <Field label="Voice Track"><PathInput value={getDeep(config, 'audio.voiceTrack', '')} onChange={v => updateConfig('audio.voiceTrack', v)} filter="audio" /></Field>
      <Slider label="Volume Voice" value={Number(getDeep(config, 'audio.voiceVolume', 100))} onChange={v => updateConfig('audio.voiceVolume', v)} min={0} max={150} />
      <Field label="Effect Track"><PathInput value={getDeep(config, 'audio.effectTrack', '')} onChange={v => updateConfig('audio.effectTrack', v)} filter="audio" /></Field>
      <Slider label="Volume Efek" value={Number(getDeep(config, 'audio.effectVolume', 80))} onChange={v => updateConfig('audio.effectVolume', v)} min={0} max={150} />
    </Group>
    <Group title="Beat & Reactive FX">
      <Check label="Beat detection nyata dari waveform" checked={Boolean(getDeep(config, 'audio.beatDetection', true))} onChange={v => updateConfig('audio.beatDetection', v)} />
      <Field label="Reactive FX"><SelectInput value={getDeep(config, 'audio.reactiveFx', 'Beat Flash')} onChange={v => updateConfig('audio.reactiveFx', v)}><option>Beat Flash</option><option>Logo Pulse</option><option>Background Jedug</option><option>Mati</option></SelectInput></Field>
      <Slider label="Strength" value={Number(getDeep(config, 'audio.reactiveStrength', 40))} onChange={v => updateConfig('audio.reactiveStrength', v)} min={0} max={100} />
      <Field label="Warna Flash"><SelectInput value={getDeep(config, 'audio.beatFlashColor', 'white')} onChange={v => updateConfig('audio.beatFlashColor', v)}><option>white</option><option>red</option><option>blue</option><option>yellow</option><option>cyan</option></SelectInput></Field>
    </Group>
    <Group title="Playlist & Stems">
      <Field label="Lagu Intro"><textarea className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[42px] px-1.5 py-1 resize-y" value={introText} onChange={e => setIntroText(e.target.value)} onBlur={commitIntro} placeholder="Satu path per baris" /></Field>
      <Field label="Slot Lagu"><textarea className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[42px] px-1.5 py-1 resize-y" value={slotText} onChange={e => setSlotText(e.target.value)} onBlur={commitSlots} placeholder="Satu path per baris" /></Field>
      <Field label="Lagu Terakhir"><PathInput value={getDeep(config, 'audio.endingSong', '')} onChange={v => updateConfig('audio.endingSong', v)} filter="audio" /></Field>
      <Grid3><Field label="Crossfade"><TextInput type="number" value={getDeep(config, 'audio.crossfade', 0.8)} onChange={v => updateConfig('audio.crossfade', v)} /></Field><Field label="Jeda Sunyi"><TextInput type="number" value={getDeep(config, 'audio.silenceBetween', 0)} onChange={v => updateConfig('audio.silenceBetween', v)} /></Field><Field label="Volume Akhir"><TextInput type="number" value={getDeep(config, 'audio.endingVolume', 100)} onChange={v => updateConfig('audio.endingVolume', v)} /></Field></Grid3>
      <Field label="Stem Mixer"><textarea className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[42px] px-1.5 py-1 resize-y" value={stemsText} onChange={e => setStemsText(e.target.value)} onBlur={commitStems} placeholder="Format: nama|path|volume|pan\nvocal|C:/vocal.wav|100|0" /></Field>
    </Group>
  </PanelWrap>;
}
