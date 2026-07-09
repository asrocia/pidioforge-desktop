import React, { useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, InfoBar, WarnBox } from '../ui/panel-primitives';
import { Field, Check, TextInput, SelectInput, Slider } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';
import { detectTargetFormat, applyOverlayFormatPreset } from '../../utils/format-presets';

export function OverlayPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const format = detectTargetFormat(config);
  function applyPreset(v: string) {
    updateConfig('overlay.stylePreset', v);
    if (v === 'clean') { updateConfig('overlay.vignette', false); updateConfig('overlay.filmGrain', false); updateConfig('overlay.scanlines', false); updateConfig('overlay.frameBorder', false); updateConfig('overlay.darken', false); updateConfig('overlay.letterbox', false); }
    if (v === 'cinematic') { updateConfig('overlay.vignette', true); updateConfig('overlay.vignetteStrength', 0.45); updateConfig('overlay.filmGrain', true); updateConfig('overlay.grainStrength', 8); updateConfig('overlay.letterbox', true); updateConfig('overlay.letterboxSize', 72); updateConfig('overlay.darken', true); updateConfig('overlay.darkenOpacity', 10); }
    if (v === 'live-stream') { updateConfig('overlay.timestamp', true); updateConfig('overlay.frameBorder', true); updateConfig('overlay.borderColor', '#22c55e'); updateConfig('overlay.borderThickness', 4); updateConfig('overlay.lowerThirdEnabled', true); updateConfig('overlay.lowerThirdPosition', 'Bawah'); }
    if (v === 'retro') { updateConfig('overlay.scanlines', true); updateConfig('overlay.scanlineOpacity', 8); updateConfig('overlay.filmGrain', true); updateConfig('overlay.grainStrength', 14); updateConfig('overlay.vignette', true); updateConfig('overlay.vignetteStrength', 0.3); }
    if (v === 'dark-focus') { updateConfig('overlay.darken', true); updateConfig('overlay.darkenOpacity', 22); updateConfig('overlay.vignette', true); updateConfig('overlay.vignetteStrength', 0.5); }
  }
  async function validateOverlay() {
    setBusy(true); setMessage('Memeriksa overlay...');
    try {
      const data = await api('/api/overlay/validate', { method: 'POST', body: JSON.stringify({ config }) });
      setValidation(data); setMessage(data.ok ? 'Overlay siap digunakan.' : `Perlu perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  return <PanelWrap>
    <div className="bg-[#0a1018] border-b border-[rgba(142,162,184,0.18)] px-3 py-2 space-y-1.5">
      <div className="relative h-[84px] rounded-[6px] overflow-hidden bg-[#05080c] border border-[rgba(142,162,184,0.22)]">
        {getDeep(config, 'overlay.timestamp', false) && <span className={`absolute text-[10px] px-2 py-0.5 bg-black/50 rounded-sm ${getDeep(config, 'overlay.timestampPosition', 'Kiri Atas').replaceAll(' ', '-')}`}>{getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')}</span>}
        {getDeep(config, 'overlay.lowerThirdEnabled', false) && <span className="absolute bottom-2 left-2 text-[9px] px-2 py-0.5 bg-black/50 rounded-sm text-white">{getDeep(config, 'overlay.lowerThirdText', 'LOWER THIRD')}</span>}
        {getDeep(config, 'overlay.frameBorder', false) && <span className="absolute inset-0 pointer-events-none" style={{borderColor: getDeep(config, 'overlay.borderColor', 'white'), borderWidth: `${getDeep(config, 'overlay.borderThickness', 6)}px`}} />}
        {getDeep(config, 'overlay.letterbox', false) && <><span className="absolute top-0 left-0 right-0 h-[30%] bg-black/60 pointer-events-none" /><span className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/60 pointer-events-none" /></>}
        {getDeep(config, 'overlay.scanlines', false) && <span className="absolute inset-0 pointer-events-none" style={{background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)'}} />}
        {getDeep(config, 'overlay.darken', false) && <span className="absolute inset-0 bg-black/20 pointer-events-none" />}
      </div>
      <div className="flex items-center gap-1.5">
        <SelectInput value={getDeep(config, 'overlay.stylePreset', 'clean')} onChange={applyPreset}><option value="clean">Clean</option><option value="cinematic">Cinematic</option><option value="live-stream">Live Stream</option><option value="retro">Retro Scanline</option><option value="dark-focus">Dark Focus</option></SelectInput>
        <ActionBtn onClick={() => applyOverlayFormatPreset(updateConfig, format)}>Format {format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9'}</ActionBtn>
        <ActionBtn onClick={validateOverlay} disabled={busy}>Cek Overlay</ActionBtn>
      </div>
      {message && <InfoBar variant={validation?.ok ? 'ok' : 'error'}>{cleanUiText(message)}</InfoBar>}
      {validation?.warnings?.length ? <WarnBox title="Catatan overlay:" items={validation.warnings.map((w: string) => cleanUiText(w))} /> : null}
    </div>

    <Group title="Particle & Asset">
      <Check label="Video Partikel" checked={Boolean(getDeep(config, 'overlay.videoParticle', true))} onChange={v => updateConfig('overlay.videoParticle', v)} />
      <Field label="File Partikel"><PathInput value={getDeep(config, 'overlay.particleFile')} onChange={v => updateConfig('overlay.particleFile', v)} placeholder="Video particle / light leak" filter="video" /></Field>
      <Slider label="Opacity Partikel" value={Number(getDeep(config, 'overlay.particleOpacity', 70))} onChange={v => updateConfig('overlay.particleOpacity', v)} min={0} max={100} />
      <Grid3><Field label="Kecepatan"><TextInput type="number" value={getDeep(config, 'overlay.particleSpeed', 100)} onChange={v => updateConfig('overlay.particleSpeed', v)} /></Field><Field label="Campur"><SelectInput value={getDeep(config, 'overlay.particleBlend', 'normal')} onChange={v => updateConfig('overlay.particleBlend', v)}><option>normal</option><option>screen</option><option>add</option></SelectInput></Field><Field label="Transisi Lagu"><SelectInput value={getDeep(config, 'overlay.songTransition', 'fade')} onChange={v => updateConfig('overlay.songTransition', v)}><option>fade</option><option>cut</option><option>mix</option></SelectInput></Field></Grid3>
      <Check label="Overlay asset tambahan" checked={Boolean(getDeep(config, 'overlay.overlayEnabled', false))} onChange={v => updateConfig('overlay.overlayEnabled', v)} />
      <Field label="File Overlay"><PathInput value={getDeep(config, 'overlay.overlayFile', '')} onChange={v => updateConfig('overlay.overlayFile', v)} placeholder="PNG/video overlay" filter="visual" /></Field>
      <Grid3><Field label="Posisi"><SelectInput value={getDeep(config, 'overlay.overlayPosition', 'Tengah')} onChange={v => updateConfig('overlay.overlayPosition', v)}><option>Tengah</option><option>Kanan Atas</option><option>Kiri Atas</option><option>Kanan Bawah</option><option>Kiri Bawah</option></SelectInput></Field><Field label="Mulai"><TextInput type="number" value={getDeep(config, 'overlay.overlayStart', 0)} onChange={v => updateConfig('overlay.overlayStart', v)} /></Field><Field label="Selesai"><TextInput type="number" value={getDeep(config, 'overlay.overlayEnd', 0)} onChange={v => updateConfig('overlay.overlayEnd', v)} /></Field></Grid3>
      <Slider label="Opacity Overlay" value={Number(getDeep(config, 'overlay.overlayOpacity', 80))} onChange={v => updateConfig('overlay.overlayOpacity', v)} min={0} max={100} />
      <Slider label="Skala Overlay" value={Number(getDeep(config, 'overlay.overlayScale', 100))} onChange={v => updateConfig('overlay.overlayScale', v)} min={5} max={160} />
    </Group>

    <Group title="Teks Overlay">
      <Check label="Timestamp / Label" checked={Boolean(getDeep(config, 'overlay.timestamp', false))} onChange={v => updateConfig('overlay.timestamp', v)} />
      <Grid3><Field label="Text"><TextInput value={getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')} onChange={v => updateConfig('overlay.timestampText', v)} /></Field><Field label="Posisi"><SelectInput value={getDeep(config, 'overlay.timestampPosition', 'Kiri Atas')} onChange={v => updateConfig('overlay.timestampPosition', v)}><option>Kiri Atas</option><option>Kanan Atas</option><option>Kiri Bawah</option><option>Kanan Bawah</option></SelectInput></Field><Field label="Playlist"><SelectInput value={getDeep(config, 'overlay.playlist', true) ? 'Aktif' : 'Mati'} onChange={v => updateConfig('overlay.playlist', v === 'Aktif')}><option value="Aktif">Aktif</option><option value="Mati">Mati</option></SelectInput></Field></Grid3>
      <Check label="Lower Third" checked={Boolean(getDeep(config, 'overlay.lowerThirdEnabled', false))} onChange={v => updateConfig('overlay.lowerThirdEnabled', v)} />
      <Field label="Lower Third Text"><TextInput value={getDeep(config, 'overlay.lowerThirdText', '')} onChange={v => updateConfig('overlay.lowerThirdText', v)} placeholder="Judul / nama channel / info lagu" /></Field>
      <Grid3><Field label="Posisi"><SelectInput value={getDeep(config, 'overlay.lowerThirdPosition', 'Bawah')} onChange={v => updateConfig('overlay.lowerThirdPosition', v)}><option>Bawah</option><option>Tengah</option><option>Atas</option></SelectInput></Field><Field label="Muncul detik"><TextInput type="number" value={getDeep(config, 'overlay.lowerThirdAt', 2)} onChange={v => updateConfig('overlay.lowerThirdAt', v)} /></Field><Field label="Durasi"><TextInput type="number" value={getDeep(config, 'overlay.lowerThirdDuration', 5)} onChange={v => updateConfig('overlay.lowerThirdDuration', v)} /></Field></Grid3>
    </Group>

    <Group title="Efek Sinematik">
      <Check label="Vignette" checked={Boolean(getDeep(config, 'overlay.vignette', false))} onChange={v => updateConfig('overlay.vignette', v)} />
      <Slider label="Vignette Strength" value={Number(getDeep(config, 'overlay.vignetteStrength', 0.35)) * 100} onChange={v => updateConfig('overlay.vignetteStrength', v / 100)} min={0} max={100} />
      <Check label="Film Grain" checked={Boolean(getDeep(config, 'overlay.filmGrain', false))} onChange={v => updateConfig('overlay.filmGrain', v)} />
      <Slider label="Grain Strength" value={Number(getDeep(config, 'overlay.grainStrength', 12))} onChange={v => updateConfig('overlay.grainStrength', v)} min={0} max={40} />
      <Check label="Scanlines" checked={Boolean(getDeep(config, 'overlay.scanlines', false))} onChange={v => updateConfig('overlay.scanlines', v)} />
      <Slider label="Scanline Opacity" value={Number(getDeep(config, 'overlay.scanlineOpacity', 6))} onChange={v => updateConfig('overlay.scanlineOpacity', v)} min={0} max={30} />
      <Check label="Darken overlay" checked={Boolean(getDeep(config, 'overlay.darken', false))} onChange={v => updateConfig('overlay.darken', v)} />
      <Slider label="Darken Opacity" value={Number(getDeep(config, 'overlay.darkenOpacity', 15))} onChange={v => updateConfig('overlay.darkenOpacity', v)} min={0} max={60} />
    </Group>

    <Group title="Frame & Rasio">
      <Check label="Frame Border" checked={Boolean(getDeep(config, 'overlay.frameBorder', false))} onChange={v => updateConfig('overlay.frameBorder', v)} />
      <Grid3><Field label="Warna Border"><TextInput value={getDeep(config, 'overlay.borderColor', 'white')} onChange={v => updateConfig('overlay.borderColor', v)} /></Field><Field label="Ketebalan"><TextInput type="number" value={getDeep(config, 'overlay.borderThickness', 6)} onChange={v => updateConfig('overlay.borderThickness', v)} /></Field><Field label="Warna Glow"><TextInput value={getDeep(config, 'overlay.glowColor', '#22c55e')} onChange={v => updateConfig('overlay.glowColor', v)} /></Field></Grid3>
      <Check label="Letterbox cinematic" checked={Boolean(getDeep(config, 'overlay.letterbox', false))} onChange={v => updateConfig('overlay.letterbox', v)} />
      <Slider label="Letterbox Size" value={Number(getDeep(config, 'overlay.letterboxSize', 80))} onChange={v => updateConfig('overlay.letterboxSize', v)} min={0} max={180} />
    </Group>
  </PanelWrap>;
}
