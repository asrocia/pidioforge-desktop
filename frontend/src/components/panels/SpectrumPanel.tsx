import React, { useState } from 'react';
import { Field, Check, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';
import { detectTargetFormat, applySpectrumFormatPreset } from '../../utils/format-presets';
import { fileUrl, mediaKind, nowPlayingText } from '../../utils/media';
import { Callout, Card, StatRow, SliderControl } from '../ui/design-system-components';

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
  return (<div className="space-y-4">
        {/* Preview Area */}
        <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] space-y-3">
          <div className="relative h-[96px] rounded-[var(--radius-md)] overflow-hidden bg-[var(--tertiary-bg)] border border-[var(--border-subtle)]" onMouseMove={e => dragging && setDragPosition(e)} onMouseUp={() => setDragging('')} onMouseLeave={() => setDragging('')}>
            {visual && visualType === 'video' && <video className="absolute inset-0 w-full h-full object-cover" src={fileUrl(visual)} muted loop autoPlay playsInline />}
            {visual && visualType === 'image' && <img className="absolute inset-0 w-full h-full object-cover" src={fileUrl(visual)} />}
            <div className="absolute inset-0 bg-black/30" />
            {getDeep(config, 'spectrum.nowPlaying', true) && <div className="absolute text-[13px] font-bold text-white drop-shadow-md cursor-move select-none whitespace-nowrap" contentEditable suppressContentEditableWarning onBlur={e => editNowPlaying(e.currentTarget.textContent || '')} onMouseDown={e => { setDragging('nowPlaying'); setDragPosition(e, 'nowPlaying'); }} style={{ left: `${npX}%`, top: `${npY}%`, color: getDeep(config, 'spectrum.nowPlayingColor', '#ffffff'), fontSize: `${Number(getDeep(config, 'spectrum.nowPlayingFontSize', 26))}px` }}>{nowPlayingText(config)}</div>}
            {getDeep(config, 'spectrum.enabled', true) && <div className="absolute flex items-end gap-px cursor-move" onMouseDown={e => { setDragging('spectrum'); setDragPosition(e, 'spectrum'); }} style={{ left: '5%', right: '5%', top: `${spY}%`, height: `${spectrumPreviewheight}px`, opacity: Number(getDeep(config, 'spectrum.transparency', 80)) / 100 }}>{(peaks.length ? peaks : Array.from({length: 64}, (_, i) => ((i * 17) % 60) / 60)).slice(0,64).map((p: number, i: number) => <i key={i} className="w-full rounded-t-sm" style={{height: `${8 + Number(p) * Math.max(34, spectrumPreviewheight - 12)}px`, background: i % 2 ? getDeep(config, 'spectrum.color2', '#38bdf8') : getDeep(config, 'spectrum.color1', 'white')}} />)}</div>}
            {getDeep(config, 'spectrum.progressBar', true) && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20"><span className="block h-full w-[33%]" style={{ background: getDeep(config, 'spectrum.progressColor', '#22c55e') }} /></div>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SelectInput value={getDeep(config, 'spectrum.stylePreset', 'clean-wave')} onChange={applyPreset}><option value="clean-wave">Gelombang Bersih</option><option value="neon-bars">Batang Neon</option><option value="minimal-line">Garis Minimal</option><option value="shorts-center">Tengah Shorts</option></SelectInput>
            <button onClick={() => applySpectrumFormatPreset(updateConfig, format)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Format {format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9'}</button>
            <button onClick={loadPreview} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Pratinjau</button>
            <button onClick={analyzeAndTune} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Tuning Otomatis</button>
          </div>
          {message && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium', preview?.ok ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]')}>
              {cleanUiText(message)}
            </div>
          )}
          {tuned && (
            <StatRow
              stats={[
                { label: 'Sensitivitas', value: tuned.sensitivity },
                { label: 'Tinggi', value: tuned.height },
                { label: 'Rentang Dinamis', value: tuned.dynamicRange },
                { label: 'Beat', value: preview?.beats?.length || 0, accent: true },
              ]}
            />
          )}
          {tuned?.warnings?.length ? (
            <div className="p-3 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
              <h4 className="text-[11px] font-bold text-[var(--accent-warning)] mb-2">⚠ Catatan analisis:</h4>
              <ul className="space-y-1.5">
                {tuned.warnings.map((w: string, i: number) => (
                  <li key={i} className="text-[10px] text-[var(--text-primary)] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]">
                    {cleanUiText(w)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Media Utama */}
        <Card title="Media Utama">
          <Field label="Audio"><PathInput value={getDeep(config, 'input.audio', '')} onChange={v => updateConfig('input.audio', v)} placeholder="Pilih lagu/audio untuk spektrum" filter="audio" /></Field>
          <Field label="Visual"><PathInput value={getDeep(config, 'input.visual', '')} onChange={v => updateConfig('input.visual', v)} placeholder="Pilih video/gambar latar" filter="visual" /></Field>
          <Field label="Judul"><TextInput value={getDeep(config, 'input.title', '')} onChange={v => updateConfig('input.title', v)} placeholder="Klik teks di pratinjau untuk edit cepat" /></Field>
          <Callout type="tip">
            Geser teks atau spektrum langsung di pratinjau. Klik teks Now Playing untuk mengubah judul.
          </Callout>
        </Card>

        {/* Visualizer */}
        <Card title="Visualizer">
          <Check label="Spektrum Audio" checked={Boolean(getDeep(config, 'spectrum.enabled', true))} onChange={v => updateConfig('spectrum.enabled', v)} />
          <Field label="Model"><SelectInput value={getDeep(config, 'spectrum.model', 'Wave')} onChange={v => updateConfig('spectrum.model', v)}><option>Bar</option><option>Wave</option><option>Line</option><option>Circular</option><option>Radial</option><option>3D Bars</option></SelectInput></Field>
          <Field label="Analisis"><SelectInput value={getDeep(config, 'spectrum.analyzerMode', 'frequency')} onChange={v => updateConfig('spectrum.analyzerMode', v)}><option value="frequency">Frekuensi Nyata</option><option value="waveform">Waveform</option></SelectInput></Field>
          <Field label="Posisi"><SelectInput value={getDeep(config, 'spectrum.position', 'Bawah')} onChange={v => updateConfig('spectrum.position', v)}><option>Bawah</option><option>Tengah</option><option>Atas</option></SelectInput></Field>
          <Field label="Pantul"><SelectInput value={getDeep(config, 'spectrum.mirror', 'Off')} onChange={v => updateConfig('spectrum.mirror', v)}><option value="Off">Mati</option><option value="On">Aktif</option><option value="Mirror">Mirror</option></SelectInput></Field>
          <Field label="Kualitas"><SelectInput value={getDeep(config, 'spectrum.analyzerQuality', 'balanced')} onChange={v => updateConfig('spectrum.analyzerQuality', v)}><option value="fast">Cepat</option><option value="balanced">Seimbang</option><option value="high">Tinggi</option></SelectInput></Field>
          <Field label="Auto Tune"><SelectInput value={getDeep(config, 'spectrum.autoTune', true) ? 'Aktif' : 'Mati'} onChange={v => updateConfig('spectrum.autoTune', v === 'Aktif')}><option value="Aktif">Aktif</option><option value="Mati">Mati</option></SelectInput></Field>
          <SliderControl label="Tinggi Spectrum" value={Number(getDeep(config, 'spectrum.height', 128))} onChange={v => updateConfig('spectrum.height', v)} min={32} max={300} />
          <SliderControl label="Posisi Spectrum" value={spY} onChange={v => { updateConfig('spectrum.previewY', v); updateConfig('spectrum.y', v - 50); updateConfig('spectrum.position', v < 34 ? 'Atas' : v > 66 ? 'Bawah' : 'Tengah'); }} min={6} max={94} />
          <SliderControl label="Transparansi" value={Number(getDeep(config, 'spectrum.transparency', 80))} onChange={v => updateConfig('spectrum.transparency', v)} min={10} max={100} />
          <Field label="Lebar"><SelectInput value={getDeep(config, 'spectrum.widthMode', 'full')} onChange={v => updateConfig('spectrum.widthMode', v)}><option value="full">Penuh</option><option value="center">Tengah</option></SelectInput></Field>
          <Field label="Jarak X"><TextInput type="number" value={getDeep(config, 'spectrum.marginX', 0)} onChange={v => updateConfig('spectrum.marginX', v)} /></Field>
          <Field label="Jarak Y"><TextInput type="number" value={getDeep(config, 'spectrum.marginY', 34)} onChange={v => updateConfig('spectrum.marginY', v)} /></Field>
        </Card>

        {/* Particle Effects */}
        <Card title="Particle Effects">
          <Check label="Enable Particle Effects" checked={Boolean(getDeep(config, 'spectrum.particles.enabled', false))} onChange={v => updateConfig('spectrum.particles.enabled', v)} />
          <Field label="Particle Type">
            <SelectInput value={getDeep(config, 'spectrum.particles.type', 'confetti')} onChange={v => updateConfig('spectrum.particles.type', v)}>
              <option value="confetti">Confetti</option>
              <option value="sparkles">Sparkles</option>
              <option value="bubbles">Bubbles</option>
              <option value="notes">Music Notes</option>
              <option value="stars">Stars</option>
            </SelectInput>
          </Field>
          <Field label="Trigger">
            <SelectInput value={getDeep(config, 'spectrum.particles.trigger', 'beat')} onChange={v => updateConfig('spectrum.particles.trigger', v)}>
              <option value="beat">On Beat</option>
              <option value="continuous">Continuous</option>
              <option value="drop">On Drop</option>
            </SelectInput>
          </Field>
          <Field label="Density">
            <SelectInput value={getDeep(config, 'spectrum.particles.density', 'medium')} onChange={v => updateConfig('spectrum.particles.density', v)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="extreme">Extreme</option>
            </SelectInput>
          </Field>
          <SliderControl label="Particle Size" value={Number(getDeep(config, 'spectrum.particles.size', 8))} onChange={v => updateConfig('spectrum.particles.size', v)} min={4} max={32} />
          <SliderControl label="Particle Speed" value={Number(getDeep(config, 'spectrum.particles.speed', 50))} onChange={v => updateConfig('spectrum.particles.speed', v)} min={10} max={100} />
          <SliderControl label="Lifetime (seconds)" value={Number(getDeep(config, 'spectrum.particles.lifetime', 3))} onChange={v => updateConfig('spectrum.particles.lifetime', v)} min={1} max={10} />
          <Field label="Particle Color 1">
            <TextInput value={getDeep(config, 'spectrum.particles.color1', '#ff6b6b')} onChange={v => updateConfig('spectrum.particles.color1', v)} />
          </Field>
          <Field label="Particle Color 2">
            <TextInput value={getDeep(config, 'spectrum.particles.color2', '#4ecdc4')} onChange={v => updateConfig('spectrum.particles.color2', v)} />
          </Field>
          <Check label="Rainbow Colors" checked={Boolean(getDeep(config, 'spectrum.particles.rainbow', false))} onChange={v => updateConfig('spectrum.particles.rainbow', v)} />
          <Check label="Gravity Effect" checked={Boolean(getDeep(config, 'spectrum.particles.gravity', true))} onChange={v => updateConfig('spectrum.particles.gravity', v)} />
          <Callout type="tip">
            Particle effects menambah energi visual. Gunakan "On Beat" untuk sinkronisasi dengan musik.
          </Callout>
        </Card>

        {/* Warna & Reaksi Beat */}
        <Card title="Warna & Reaksi Beat">
          <Field label="Color Mode">
            <SelectInput value={getDeep(config, 'spectrum.colorMode', 'static')} onChange={v => updateConfig('spectrum.colorMode', v)}>
              <option value="static">Static</option>
              <option value="gradient">Gradient</option>
              <option value="rainbow">Rainbow Cycle</option>
              <option value="beat-reactive">Beat Reactive</option>
              <option value="pulse">Pulse</option>
            </SelectInput>
          </Field>
          <Field label="Warna 1"><TextInput value={getDeep(config, 'spectrum.color1', 'white')} onChange={v => { updateConfig('spectrum.color1', v); setTimeout(commitColors, 0); }} /></Field>
          <Field label="Warna 2"><TextInput value={getDeep(config, 'spectrum.color2', '#22c55e')} onChange={v => { updateConfig('spectrum.color2', v); setTimeout(commitColors, 0); }} /></Field>
          <Field label="Warna Progress"><TextInput value={getDeep(config, 'spectrum.progressColor', 'white')} onChange={v => updateConfig('spectrum.progressColor', v)} /></Field>
          <Field label="Gradient Direction">
            <SelectInput value={getDeep(config, 'spectrum.gradientDirection', 'horizontal')} onChange={v => updateConfig('spectrum.gradientDirection', v)}>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="radial">Radial</option>
            </SelectInput>
          </Field>
          <Field label="Rainbow Speed">
            <TextInput type="number" value={getDeep(config, 'spectrum.rainbowSpeed', 2)} onChange={v => updateConfig('spectrum.rainbowSpeed', v)} placeholder="1-10" />
          </Field>
          <Check label="Glow beat reactive" checked={Boolean(getDeep(config, 'spectrum.glow', false))} onChange={v => updateConfig('spectrum.glow', v)} />
          <SliderControl label="Kekuatan Glow" value={Number(getDeep(config, 'spectrum.glowStrength', 35))} onChange={v => updateConfig('spectrum.glowStrength', v)} min={0} max={100} />
          <Check label="Beat Reactive" checked={Boolean(getDeep(config, 'spectrum.beatReactive', true))} onChange={v => updateConfig('spectrum.beatReactive', v)} />
          <SliderControl label="Sensitivitas Beat" value={Number(getDeep(config, 'spectrum.beatSensitivity', 55))} onChange={v => updateConfig('spectrum.beatSensitivity', v)} min={0} max={100} />
          <SliderControl label="Smoothing" value={Number(getDeep(config, 'spectrum.smoothing', 45))} onChange={v => updateConfig('spectrum.smoothing', v)} min={0} max={100} />
          <Field label="Penguatan"><TextInput type="number" value={getDeep(config, 'spectrum.gain', 1)} onChange={v => updateConfig('spectrum.gain', v)} /></Field>
        </Card>

        {/* Progress */}
        <Card title="Progress">
          <Check label="Progress Bar" checked={Boolean(getDeep(config, 'spectrum.progressBar', true))} onChange={v => updateConfig('spectrum.progressBar', v)} />
          <Field label="Gaya"><SelectInput value={getDeep(config, 'spectrum.progressStyle', 'line')} onChange={v => updateConfig('spectrum.progressStyle', v)}><option value="line">Line</option><option value="thin">Thin</option></SelectInput></Field>
          <Field label="Status"><input readOnly className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1" value={getDeep(config, 'spectrum.progressBar', true) ? 'Aktif' : 'Mati'} /></Field>
          <Field label="Durasi"><input readOnly className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1" value={`${getDeep(config, 'target.duration', 0) || 'audio'}s`} /></Field>
        </Card>

        {/* Logo/Watermark Overlay */}
        <Card title="Logo/Watermark Overlay">
          <Check label="Enable Logo/Watermark" checked={Boolean(getDeep(config, 'spectrum.logo.enabled', false))} onChange={v => updateConfig('spectrum.logo.enabled', v)} />
          <Field label="Logo Image">
            <PathInput value={getDeep(config, 'spectrum.logo.image', '')} onChange={v => updateConfig('spectrum.logo.image', v)} placeholder="Pilih logo/watermark" filter="image" />
          </Field>
          <Field label="Position">
            <SelectInput value={getDeep(config, 'spectrum.logo.position', 'top-right')} onChange={v => updateConfig('spectrum.logo.position', v)}>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="center">Center</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="custom">Custom (X/Y)</option>
            </SelectInput>
          </Field>
          <Field label="Size %">
            <TextInput type="number" value={getDeep(config, 'spectrum.logo.size', 15)} onChange={v => updateConfig('spectrum.logo.size', v)} placeholder="5-50" />
          </Field>
          <Field label="Opacity %">
            <TextInput type="number" value={getDeep(config, 'spectrum.logo.opacity', 80)} onChange={v => updateConfig('spectrum.logo.opacity', v)} placeholder="0-100" />
          </Field>
          <Field label="Custom X %">
            <TextInput type="number" value={getDeep(config, 'spectrum.logo.x', 85)} onChange={v => updateConfig('spectrum.logo.x', v)} placeholder="0-100" />
          </Field>
          <Field label="Custom Y %">
            <TextInput type="number" value={getDeep(config, 'spectrum.logo.y', 10)} onChange={v => updateConfig('spectrum.logo.y', v)} placeholder="0-100" />
          </Field>
          <Field label="Animation">
            <SelectInput value={getDeep(config, 'spectrum.logo.animation', 'none')} onChange={v => updateConfig('spectrum.logo.animation', v)}>
              <option value="none">None</option>
              <option value="fade">Fade In/Out</option>
              <option value="pulse">Pulse</option>
              <option value="bounce">Bounce</option>
              <option value="rotate">Rotate</option>
            </SelectInput>
          </Field>
          <SliderControl label="Padding (px)" value={Number(getDeep(config, 'spectrum.logo.padding', 20))} onChange={v => updateConfig('spectrum.logo.padding', v)} min={0} max={100} />
          <Check label="Beat Reactive" checked={Boolean(getDeep(config, 'spectrum.logo.beatReactive', false))} onChange={v => updateConfig('spectrum.logo.beatReactive', v)} />
          <Callout type="tip">
            Logo akan muncul di atas video. Gunakan PNG transparan untuk hasil terbaik. Drag di preview untuk posisi custom.
          </Callout>
        </Card>

        {/* Info Lagu */}
        <Card title="Info Lagu">
          <Check label="Now Playing" checked={Boolean(getDeep(config, 'spectrum.nowPlaying', true))} onChange={v => updateConfig('spectrum.nowPlaying', v)} />
          <Field label="Template"><TextInput value={getDeep(config, 'spectrum.nowPlayingTemplate', '{title}')} onChange={v => updateConfig('spectrum.nowPlayingTemplate', v)} /></Field>
          <Field label="Posisi"><SelectInput value={getDeep(config, 'spectrum.nowPlayingPosition', 'Atas')} onChange={v => updateConfig('spectrum.nowPlayingPosition', v)}><option>Atas</option><option>Tengah</option><option>Bawah</option></SelectInput></Field>
          <Field label="Ukuran Font"><TextInput type="number" value={getDeep(config, 'spectrum.nowPlayingFontSize', 26)} onChange={v => updateConfig('spectrum.nowPlayingFontSize', v)} /></Field>
          
          {/* Text Effects */}
          <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Text Effects</h4>
            <Field label="Font Family">
              <SelectInput value={getDeep(config, 'spectrum.nowPlayingFont', 'Inter')} onChange={v => updateConfig('spectrum.nowPlayingFont', v)}>
                <option value="Inter">Inter (Default)</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
              </SelectInput>
            </Field>
            <Field label="Font Weight">
              <SelectInput value={getDeep(config, 'spectrum.nowPlayingFontWeight', 'bold')} onChange={v => updateConfig('spectrum.nowPlayingFontWeight', v)}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="bolder">Bolder</option>
                <option value="lighter">Lighter</option>
              </SelectInput>
            </Field>
            <Field label="Text Transform">
              <SelectInput value={getDeep(config, 'spectrum.nowPlayingTransform', 'none')} onChange={v => updateConfig('spectrum.nowPlayingTransform', v)}>
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="capitalize">Capitalize</option>
              </SelectInput>
            </Field>
            <Check label="Text Shadow" checked={Boolean(getDeep(config, 'spectrum.nowPlayingShadow', true))} onChange={v => updateConfig('spectrum.nowPlayingShadow', v)} />
            <SliderControl label="Shadow Blur" value={Number(getDeep(config, 'spectrum.nowPlayingShadowBlur', 4))} onChange={v => updateConfig('spectrum.nowPlayingShadowBlur', v)} min={0} max={20} />
            <Check label="Text Outline" checked={Boolean(getDeep(config, 'spectrum.nowPlayingOutline', false))} onChange={v => updateConfig('spectrum.nowPlayingOutline', v)} />
            <Field label="Outline Color">
              <TextInput value={getDeep(config, 'spectrum.nowPlayingOutlineColor', '#000000')} onChange={v => updateConfig('spectrum.nowPlayingOutlineColor', v)} />
            </Field>
            <Field label="Outline Width">
              <TextInput type="number" value={getDeep(config, 'spectrum.nowPlayingOutlineWidth', 2)} onChange={v => updateConfig('spectrum.nowPlayingOutlineWidth', v)} placeholder="1-5" />
            </Field>
            <Check label="Text Glow" checked={Boolean(getDeep(config, 'spectrum.nowPlayingGlow', false))} onChange={v => updateConfig('spectrum.nowPlayingGlow', v)} />
            <Field label="Glow Color">
              <TextInput value={getDeep(config, 'spectrum.nowPlayingGlowColor', '#ffffff')} onChange={v => updateConfig('spectrum.nowPlayingGlowColor', v)} />
            </Field>
            <Field label="Glow Strength">
              <TextInput type="number" value={getDeep(config, 'spectrum.nowPlayingGlowStrength', 10)} onChange={v => updateConfig('spectrum.nowPlayingGlowStrength', v)} placeholder="5-30" />
            </Field>
            <Check label="Beat Reactive Text" checked={Boolean(getDeep(config, 'spectrum.nowPlayingBeatReactive', false))} onChange={v => updateConfig('spectrum.nowPlayingBeatReactive', v)} />
            <Field label="Text Animation">
              <SelectInput value={getDeep(config, 'spectrum.nowPlayingAnimation', 'none')} onChange={v => updateConfig('spectrum.nowPlayingAnimation', v)}>
                <option value="none">None</option>
                <option value="fade">Fade In</option>
                <option value="slide">Slide In</option>
                <option value="bounce">Bounce</option>
                <option value="typewriter">Typewriter</option>
                <option value="pulse">Pulse</option>
              </SelectInput>
            </Field>
          </div>
          <Field label="Posisi X"><TextInput type="number" value={npX} onChange={v => updateConfig('spectrum.nowPlayingX', Math.max(4, Math.min(96, Number(v || 50))))} /></Field>
          <Field label="Posisi Y"><TextInput type="number" value={npY} onChange={v => updateConfig('spectrum.nowPlayingY', Math.max(6, Math.min(94, Number(v || 14))))} /></Field>
          <Field label="Edit Cepat"><input readOnly className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1" value="klik teks di preview" /></Field>
          <Field label="Artis"><TextInput value={getDeep(config, 'spectrum.nowPlayingArtist', '')} onChange={v => updateConfig('spectrum.nowPlayingArtist', v)} /></Field>
          <Field label="Album"><TextInput value={getDeep(config, 'spectrum.nowPlayingAlbum', '')} onChange={v => updateConfig('spectrum.nowPlayingAlbum', v)} /></Field>
          <Field label="Warna"><TextInput value={getDeep(config, 'spectrum.nowPlayingColor', '#ffffff')} onChange={v => updateConfig('spectrum.nowPlayingColor', v)} /></Field>
          <Check label="Auto ambil judul dari nama file jika kosong" checked={Boolean(getDeep(config, 'spectrum.nowPlayingAutoFromFile', true))} onChange={v => updateConfig('spectrum.nowPlayingAutoFromFile', v)} />
          <Callout type="tip">
            Variable template: {'{title}'}, {'{artist}'}, {'{album}'}, {'{filename}'}
          </Callout>
        </Card>
      </div>);
}
