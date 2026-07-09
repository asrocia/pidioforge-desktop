import React, { useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, InfoBar, WarnBox, Hint, StatRow } from '../ui/panel-primitives';
import { Field, Check, TextInput, SelectInput, Slider } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';
import { detectTargetFormat, applySpectrumFormatPreset } from '../../utils/format-presets';
import { fileUrl, mediaKind, nowPlayingText } from '../../utils/media';

export function SpectrumPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [preview, setPreview] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<'nowPlaying' | 'spectrum' | ''>('');
  const format = detectTargetFormat(config);
  const tuned = preview?.tuned;
  const peaks = preview?.waveform?.peaks || [];
  const visual = getDeep(config, 'input.visual', '');
  const visualType = mediaKind(visual);
  const npX = Number(getDeep(config, 'spectrum.nowPlayingX', 50));
  const npY = Number(getDeep(config, 'spectrum.nowPlayingY', getDeep(config, 'spectrum.nowPlayingPosition', 'Atas') === 'Bawah' ? 84 : getDeep(config, 'spectrum.nowPlayingPosition', 'Atas') === 'Tengah' ? 50 : 14));
  const spY = Number(getDeep(config, 'spectrum.previewY', getDeep(config, 'spectrum.position', 'Bawah') === 'Atas' ? 22 : getDeep(config, 'spectrum.position', 'Bawah') === 'Tengah' ? 50 : 74));
  const spectrumheight = Number(getDeep(config, 'spectrum.height', 128));
  const spectrumPreviewheight = Math.max(42, Math.min(160, Math.round(spectrumheight * 0.56)));
  function applyPreset(v: string) {
    updateConfig('spectrum.stylePreset', v);
    if (v === 'clean-wave') { updateConfig('spectrum.enabled', true); updateConfig('spectrum.model', 'Wave'); updateConfig('spectrum.position', 'Bawah'); updateConfig('spectrum.previewY', 74); updateConfig('spectrum.nowPlayingY', 14); updateConfig('spectrum.height', 128); updateConfig('spectrum.transparency', 78); updateConfig('spectrum.colors', ['white']); updateConfig('spectrum.progressBar', true); updateConfig('spectrum.nowPlaying', true); }
    if (v === 'neon-bars') { updateConfig('spectrum.enabled', true); updateConfig('spectrum.model', 'Bar'); updateConfig('spectrum.position', 'Bawah'); updateConfig('spectrum.previewY', 74); updateConfig('spectrum.nowPlayingY', 14); updateConfig('spectrum.height', 160); updateConfig('spectrum.transparency', 85); updateConfig('spectrum.colors', ['#22c55e', '#38bdf8']); updateConfig('spectrum.color1', '#22c55e'); updateConfig('spectrum.color2', '#38bdf8'); updateConfig('spectrum.glow', true); updateConfig('spectrum.glowStrength', 45); updateConfig('spectrum.progressColor', '#22c55e'); }
    if (v === 'minimal-line') { updateConfig('spectrum.enabled', true); updateConfig('spectrum.model', 'Line'); updateConfig('spectrum.height', 84); updateConfig('spectrum.transparency', 65); updateConfig('spectrum.colors', ['white']); updateConfig('spectrum.progressStyle', 'thin'); updateConfig('spectrum.nowPlayingPosition', 'Atas'); updateConfig('spectrum.nowPlayingY', 14); }
    if (v === 'shorts-center') { updateConfig('spectrum.enabled', true); updateConfig('spectrum.model', 'Wave'); updateConfig('spectrum.position', 'Tengah'); updateConfig('spectrum.previewY', 55); updateConfig('spectrum.height', 180); updateConfig('spectrum.transparency', 72); updateConfig('spectrum.colors', ['white', '#facc15']); updateConfig('spectrum.color1', 'white'); updateConfig('spectrum.color2', '#facc15'); updateConfig('spectrum.nowPlayingPosition', 'Atas'); updateConfig('spectrum.nowPlayingY', 14); }
  }
  async function loadPreview() {
    setBusy(true); setMessage('Generate preview spectrum...');
    try {
      const data = await api('/api/spectrum/preview', { method: 'POST', body: JSON.stringify({ config, audio: getDeep(config, 'input.audio'), seconds: 45, buckets: 96 }) });
      setPreview(data); setMessage(data.ok ? `Preview siap / beat ${data.beats?.length || 0} / ${data.nowPlaying?.text || ''}` : 'Preview waveform belum tersedia.');
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function analyzeAndTune() {
    setBusy(true); setMessage('Analisis spectrum + auto tune...');
    try {
      const data = await api('/api/spectrum/analyze', { method: 'POST', body: JSON.stringify({ config, audio: getDeep(config, 'input.audio'), seconds: 60, buckets: 160 }) });
      setPreview(data);
      if (data.recommendedPatch?.spectrum) {
        Object.entries(data.recommendedPatch.spectrum).forEach(([k, v]) => updateConfig(`spectrum.${k}`, v));
      }
      setMessage(data.ok ? `Penyesuaian target otomatis: Sensitivitas ${data.tuned?.Sensitivitas}, height ${data.tuned?.height}, dynamic ${data.tuned?.dynamicRange}` : 'Analisis spectrum belum tersedia.');
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  function commitColors() {
    const c1 = getDeep(config, 'spectrum.color1', 'white'); const c2 = getDeep(config, 'spectrum.color2', '');
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
  return <PanelWrap>
    <div className="bg-[#0a1018] border-b border-[rgba(142,162,184,0.18)] px-3 py-2 space-y-1.5">
      <div className="relative h-[96px] rounded-[6px] overflow-hidden bg-[#05080c] border border-[rgba(142,162,184,0.22)]" onMouseMove={e => dragging && setDragPosition(e)} onMouseUp={() => setDragging('')} onMouseLeave={() => setDragging('')}>
        {visual && visualType === 'video' && <video className="absolute inset-0 w-full h-full object-cover" src={fileUrl(visual)} muted loop autoPlay playsInline />}
        {visual && visualType === 'image' && <img className="absolute inset-0 w-full h-full object-cover" src={fileUrl(visual)} />}
        <div className="absolute inset-0 bg-black/30" />
        {getDeep(config, 'spectrum.nowPlaying', true) && <div className="absolute text-[13px] font-bold text-white drop-shadow-md cursor-move select-none whitespace-nowrap" contentEditable suppressContentEditableWarning onBlur={e => editNowPlaying(e.currentTarget.textContent || '')} onMouseDown={e => { setDragging('nowPlaying'); setDragPosition(e, 'nowPlaying'); }} style={{ left: `${npX}%`, top: `${npY}%`, color: getDeep(config, 'spectrum.nowPlayingColor', '#ffffff'), fontSize: `${Number(getDeep(config, 'spectrum.nowPlayingFontSize', 26))}px` }}>{nowPlayingText(config)}</div>}
        {getDeep(config, 'spectrum.enabled', true) && <div className="absolute flex items-end gap-px cursor-move" onMouseDown={e => { setDragging('spectrum'); setDragPosition(e, 'spectrum'); }} style={{ left: '5%', right: '5%', top: `${spY}%`, height: `${spectrumPreviewheight}px`, opacity: Number(getDeep(config, 'spectrum.transparency', 80)) / 100 }}>{(peaks.length ? peaks : Array.from({length: 64}, (_, i) => ((i * 17) % 60) / 60)).slice(0,64).map((p: number, i: number) => <i key={i} className="w-full rounded-t-sm" style={{height: `${8 + Number(p) * Math.max(34, spectrumPreviewheight - 12)}px`, background: i % 2 ? getDeep(config, 'spectrum.color2', '#38bdf8') : getDeep(config, 'spectrum.color1', 'white')}} />)}</div>}
        {getDeep(config, 'spectrum.progressBar', true) && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20"><span className="block h-full w-[33%]" style={{ background: getDeep(config, 'spectrum.progressColor', '#22c55e') }} /></div>}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <SelectInput value={getDeep(config, 'spectrum.stylePreset', 'clean-wave')} onChange={applyPreset}><option value="clean-wave">Gelombang Bersih</option><option value="neon-bars">Batang Neon</option><option value="minimal-line">Garis Minimal</option><option value="shorts-center">Tengah Shorts</option></SelectInput>
        <ActionBtn onClick={() => applySpectrumFormatPreset(updateConfig, format)}>Format {format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9'}</ActionBtn>
        <ActionBtn onClick={loadPreview} disabled={busy}>Pratinjau</ActionBtn>
        <ActionBtn onClick={analyzeAndTune} disabled={busy}>Tuning Otomatis</ActionBtn>
      </div>
      {message && <InfoBar variant={preview?.ok ? 'ok' : 'error'}>{cleanUiText(message)}</InfoBar>}
      {tuned && <StatRow items={[
        { label: 'Sensitivitas', value: tuned.sensitivity },
        { label: 'Tinggi', value: tuned.height },
        { label: 'Rentang Dinamis', value: tuned.dynamicRange },
        { label: 'Beat', value: preview?.beats?.length || 0, accent: true },
      ]} />}
      {tuned?.warnings?.length ? <WarnBox title="Catatan analisis:" items={tuned.warnings.map((w: string) => cleanUiText(w))} /> : null}
    </div>

    <Group title="Media Utama">
      <Field label="Audio"><PathInput value={getDeep(config, 'input.audio', '')} onChange={v => updateConfig('input.audio', v)} placeholder="Pilih lagu/audio untuk spektrum" filter="audio" /></Field>
      <Field label="Visual"><PathInput value={getDeep(config, 'input.visual', '')} onChange={v => updateConfig('input.visual', v)} placeholder="Pilih video/gambar latar" filter="visual" /></Field>
      <Field label="Judul"><TextInput value={getDeep(config, 'input.title', '')} onChange={v => updateConfig('input.title', v)} placeholder="Klik teks di pratinjau untuk edit cepat" /></Field>
      <Hint>Geser teks atau spektrum langsung di pratinjau. Klik teks Now Playing untuk mengubah judul.</Hint>
    </Group>

    <Group title="Visualizer">
      <Check label="Spektrum Audio" checked={Boolean(getDeep(config, 'spectrum.enabled', true))} onChange={v => updateConfig('spectrum.enabled', v)} />
      <Grid3><Field label="Model"><SelectInput value={getDeep(config, 'spectrum.model', 'Wave')} onChange={v => updateConfig('spectrum.model', v)}><option>Bar</option><option>Wave</option><option>Line</option></SelectInput></Field><Field label="Analisis"><SelectInput value={getDeep(config, 'spectrum.analyzerMode', 'frequency')} onChange={v => updateConfig('spectrum.analyzerMode', v)}><option value="frequency">Frekuensi Nyata</option><option value="waveform">Waveform</option></SelectInput></Field><Field label="Posisi"><SelectInput value={getDeep(config, 'spectrum.position', 'Bawah')} onChange={v => updateConfig('spectrum.position', v)}><option>Bawah</option><option>Tengah</option><option>Atas</option></SelectInput></Field></Grid3>
      <Grid3><Field label="Pantul"><SelectInput value={getDeep(config, 'spectrum.mirror', 'Off')} onChange={v => updateConfig('spectrum.mirror', v)}><option value="Off">Mati</option><option value="On">Aktif</option><option value="Mirror">Mirror</option></SelectInput></Field><Field label="Kualitas"><SelectInput value={getDeep(config, 'spectrum.analyzerQuality', 'balanced')} onChange={v => updateConfig('spectrum.analyzerQuality', v)}><option value="fast">Cepat</option><option value="balanced">Seimbang</option><option value="high">Tinggi</option></SelectInput></Field><Field label="Auto Tune"><SelectInput value={getDeep(config, 'spectrum.autoTune', true) ? 'Aktif' : 'Mati'} onChange={v => updateConfig('spectrum.autoTune', v === 'Aktif')}><option value="Aktif">Aktif</option><option value="Mati">Mati</option></SelectInput></Field></Grid3>
      <Slider label="Tinggi Spectrum" value={Number(getDeep(config, 'spectrum.height', 128))} onChange={v => updateConfig('spectrum.height', v)} min={32} max={300} />
      <Slider label="Posisi Spectrum" value={spY} onChange={v => { updateConfig('spectrum.previewY', v); updateConfig('spectrum.y', v - 50); updateConfig('spectrum.position', v < 34 ? 'Atas' : v > 66 ? 'Bawah' : 'Tengah'); }} min={6} max={94} />
      <Slider label="Transparansi" value={Number(getDeep(config, 'spectrum.transparency', 80))} onChange={v => updateConfig('spectrum.transparency', v)} min={10} max={100} />
      <Grid3><Field label="Lebar"><SelectInput value={getDeep(config, 'spectrum.widthMode', 'full')} onChange={v => updateConfig('spectrum.widthMode', v)}><option value="full">Penuh</option><option value="center">Tengah</option></SelectInput></Field><Field label="Jarak X"><TextInput type="number" value={getDeep(config, 'spectrum.marginX', 0)} onChange={v => updateConfig('spectrum.marginX', v)} /></Field><Field label="Jarak Y"><TextInput type="number" value={getDeep(config, 'spectrum.marginY', 34)} onChange={v => updateConfig('spectrum.marginY', v)} /></Field></Grid3>
    </Group>

    <Group title="Warna & Reaksi Beat">
      <Grid3><Field label="Warna 1"><TextInput value={getDeep(config, 'spectrum.color1', 'white')} onChange={v => { updateConfig('spectrum.color1', v); setTimeout(commitColors, 0); }} /></Field><Field label="Warna 2"><TextInput value={getDeep(config, 'spectrum.color2', '#22c55e')} onChange={v => { updateConfig('spectrum.color2', v); setTimeout(commitColors, 0); }} /></Field><Field label="Warna Progress"><TextInput value={getDeep(config, 'spectrum.progressColor', 'white')} onChange={v => updateConfig('spectrum.progressColor', v)} /></Field></Grid3>
      <Check label="Glow beat reactive" checked={Boolean(getDeep(config, 'spectrum.glow', false))} onChange={v => updateConfig('spectrum.glow', v)} />
      <Slider label="Kekuatan Glow" value={Number(getDeep(config, 'spectrum.glowStrength', 35))} onChange={v => updateConfig('spectrum.glowStrength', v)} min={0} max={100} />
      <Check label="Beat Reactive" checked={Boolean(getDeep(config, 'spectrum.beatReactive', true))} onChange={v => updateConfig('spectrum.beatReactive', v)} />
      <Slider label="Sensitivitas Beat" value={Number(getDeep(config, 'spectrum.beatSensitivity', 55))} onChange={v => updateConfig('spectrum.beatSensitivity', v)} min={0} max={100} />
      <Slider label="Smoothing" value={Number(getDeep(config, 'spectrum.smoothing', 45))} onChange={v => updateConfig('spectrum.smoothing', v)} min={0} max={100} />
      <Field label="Penguatan"><TextInput type="number" value={getDeep(config, 'spectrum.gain', 1)} onChange={v => updateConfig('spectrum.gain', v)} /></Field>
    </Group>

    <Group title="Progress">
      <Check label="Progress Bar" checked={Boolean(getDeep(config, 'spectrum.progressBar', true))} onChange={v => updateConfig('spectrum.progressBar', v)} />
      <Grid3><Field label="Gaya"><SelectInput value={getDeep(config, 'spectrum.progressStyle', 'line')} onChange={v => updateConfig('spectrum.progressStyle', v)}><option value="line">Line</option><option value="thin">Thin</option></SelectInput></Field><Field label="Status"><input readOnly className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[26px] px-1.5 py-0.5" value={getDeep(config, 'spectrum.progressBar', true) ? 'Aktif' : 'Mati'} /></Field><Field label="Durasi"><input readOnly className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[26px] px-1.5 py-0.5" value={`${getDeep(config, 'target.duration', 0) || 'audio'}s`} /></Field></Grid3>
    </Group>

    <Group title="Info Lagu">
      <Check label="Now Playing" checked={Boolean(getDeep(config, 'spectrum.nowPlaying', true))} onChange={v => updateConfig('spectrum.nowPlaying', v)} />
      <Grid3><Field label="Template"><TextInput value={getDeep(config, 'spectrum.nowPlayingTemplate', '{title}')} onChange={v => updateConfig('spectrum.nowPlayingTemplate', v)} /></Field><Field label="Posisi"><SelectInput value={getDeep(config, 'spectrum.nowPlayingPosition', 'Atas')} onChange={v => updateConfig('spectrum.nowPlayingPosition', v)}><option>Atas</option><option>Tengah</option><option>Bawah</option></SelectInput></Field><Field label="Ukuran Font"><TextInput type="number" value={getDeep(config, 'spectrum.nowPlayingFontSize', 26)} onChange={v => updateConfig('spectrum.nowPlayingFontSize', v)} /></Field></Grid3>
      <Grid3><Field label="Posisi X"><TextInput type="number" value={npX} onChange={v => updateConfig('spectrum.nowPlayingX', Math.max(4, Math.min(96, Number(v || 50))))} /></Field><Field label="Posisi Y"><TextInput type="number" value={npY} onChange={v => updateConfig('spectrum.nowPlayingY', Math.max(6, Math.min(94, Number(v || 14))))} /></Field><Field label="Edit Cepat"><input readOnly className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#8da0af] text-[11px] min-h-[26px] px-1.5 py-0.5" value="klik teks di preview" /></Field></Grid3>
      <Grid3><Field label="Artis"><TextInput value={getDeep(config, 'spectrum.nowPlayingArtist', '')} onChange={v => updateConfig('spectrum.nowPlayingArtist', v)} /></Field><Field label="Album"><TextInput value={getDeep(config, 'spectrum.nowPlayingAlbum', '')} onChange={v => updateConfig('spectrum.nowPlayingAlbum', v)} /></Field><Field label="Warna"><TextInput value={getDeep(config, 'spectrum.nowPlayingColor', '#ffffff')} onChange={v => updateConfig('spectrum.nowPlayingColor', v)} /></Field></Grid3>
      <Check label="Auto ambil judul dari nama file jika kosong" checked={Boolean(getDeep(config, 'spectrum.nowPlayingAutoFromFile', true))} onChange={v => updateConfig('spectrum.nowPlayingAutoFromFile', v)} />
      <Hint>Variable template: {'{title}'}, {'{artist}'}, {'{album}'}, {'{filename}'}</Hint>
    </Group>
  </PanelWrap>;
}
