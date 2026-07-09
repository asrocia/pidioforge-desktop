import React, { useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, WarnBox, Hint } from '../ui/panel-primitives';
import { Field, Check, TextInput, SelectInput, Slider } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';

export function BrandingPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const positionOptions = <><option>Kanan Atas</option><option>Kiri Atas</option><option>Kanan Bawah</option><option>Kiri Bawah</option><option>Tengah</option></>;
  function applyBrandPreset(v: string) {
    updateConfig('branding.brandPreset', v);
    if (v === 'none') { updateConfig('branding.bumperEnabled', false); updateConfig('branding.logoEnabled', false); updateConfig('branding.ctaEnabled', false); updateConfig('branding.watermarkEnabled', false); }
    if (v === 'logo-only') { updateConfig('branding.logoEnabled', true); updateConfig('branding.bumperEnabled', false); updateConfig('branding.ctaEnabled', false); updateConfig('branding.watermarkEnabled', false); updateConfig('branding.logoPosition', 'Kanan Atas'); updateConfig('branding.logoScale', 18); }
    if (v === 'logo-cta') { updateConfig('branding.logoEnabled', true); updateConfig('branding.ctaEnabled', true); updateConfig('branding.bumperEnabled', false); updateConfig('branding.ctaPreset', 'subscribe-lower-right'); updateConfig('branding.ctaPosition', 'Kanan Bawah'); }
    if (v === 'youtube-full') { updateConfig('branding.logoEnabled', true); updateConfig('branding.ctaEnabled', true); updateConfig('branding.bumperEnabled', true); updateConfig('branding.watermarkEnabled', true); updateConfig('branding.safeAreaPreset', 'youtube'); updateConfig('branding.logoPosition', 'Kanan Atas'); updateConfig('branding.ctaPosition', 'Kanan Bawah'); }
    if (v === 'shorts') { updateConfig('branding.logoEnabled', true); updateConfig('branding.ctaEnabled', true); updateConfig('branding.bumperEnabled', false); updateConfig('branding.watermarkEnabled', true); updateConfig('branding.safeAreaPreset', 'shorts'); updateConfig('branding.logoPosition', 'Kanan Atas'); updateConfig('branding.ctaPosition', 'Kanan Bawah'); }
  }
  function applyCtaPreset(v: string) {
    updateConfig('branding.ctaPreset', v);
    if (v === 'subscribe-lower-right') { updateConfig('branding.ctaPosition', 'Kanan Bawah'); updateConfig('branding.ctaScale', 26); updateConfig('branding.ctaAt', 2); updateConfig('branding.ctaDuration', 8); }
    if (v === 'like-subscribe-bottom') { updateConfig('branding.ctaPosition', 'Kanan Bawah'); updateConfig('branding.ctaScale', 34); updateConfig('branding.ctaAt', 4); updateConfig('branding.ctaDuration', 6); }
    if (v === 'bell-popup') { updateConfig('branding.ctaPosition', 'Kiri Bawah'); updateConfig('branding.ctaScale', 24); updateConfig('branding.ctaAt', 8); updateConfig('branding.ctaDuration', 5); }
    if (v === 'center-cta') { updateConfig('branding.ctaPosition', 'Tengah'); updateConfig('branding.ctaScale', 42); updateConfig('branding.ctaAt', 2); updateConfig('branding.ctaDuration', 4); }
  }
  async function validateBranding() {
    setBusy(true); setMessage('Memeriksa aset branding...');
    try {
      const data = await api('/api/branding/validate', { method: 'POST', body: JSON.stringify({ config }) });
      setValidation(data);
      setMessage(data.ok ? 'Aset branding siap.' : `Perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  return (
    <PanelWrap>
      {/* Toolbar + control card */}
      <div className="px-3 py-2.5 border-b border-[rgba(142,162,184,0.18)] flex flex-col gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <SelectInput value={getDeep(config, 'branding.brandPreset', 'custom')} onChange={applyBrandPreset}>
            <option value="custom">Branding Kustom</option>
            <option value="none">Tanpa Branding</option>
            <option value="logo-only">Logo Saja</option>
            <option value="logo-cta">Logo + CTA</option>
            <option value="youtube-full">Branding YouTube Penuh</option>
            <option value="shorts">Branding Shorts</option>
          </SelectInput>
          <SelectInput value={getDeep(config, 'branding.safeAreaPreset', 'youtube')} onChange={v => updateConfig('branding.safeAreaPreset', v)}>
            <option value="youtube">Area Aman YouTube</option>
            <option value="shorts">Area Aman Shorts/TikTok</option>
            <option value="reels">Area Aman Reels</option>
            <option value="center-title">Area Aman Judul Tengah</option>
          </SelectInput>
          <ActionBtn onClick={validateBranding} disabled={busy}>Validasi Aset</ActionBtn>
        </div>
        <Hint>Edit posisi branding langsung di layar PREVIEW kanan. Geser logo, CTA, atau watermark; klik watermark untuk ubah teks.</Hint>
        {message && (
          <p className={cn('text-[10.5px] px-1', validation?.ok ? 'text-[#2dbb7f]' : 'text-[#e76d78]')}>{cleanUiText(message)}</p>
        )}
        {validation?.warnings?.length ? (
          <WarnBox title="Catatan aset:" items={validation.warnings} />
        ) : null}
      </div>

      {/* Bumper Video */}
      <Group title="Bumper Video">
        <Check label="Aktifkan bumper" checked={Boolean(getDeep(config, 'branding.bumperEnabled', false))} onChange={v => updateConfig('branding.bumperEnabled', v)} />
        <Field label="File Bumper"><PathInput value={getDeep(config, 'branding.bumperVideo')} onChange={v => updateConfig('branding.bumperVideo', v)} placeholder="C:/brand/intro-outro.mp4" filter="video" /></Field>
        <Grid3>
          <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.bumperPosition', 'Akhir')} onChange={v => updateConfig('branding.bumperPosition', v)}><option>Awal</option><option>Akhir</option><option>Keduanya</option></SelectInput></Field>
          <Field label="Transisi"><SelectInput value={getDeep(config, 'branding.bumperTransition', 'fade')} onChange={v => updateConfig('branding.bumperTransition', v)}><option>fade</option><option>cut</option><option>overlay</option></SelectInput></Field>
          <Field label="Durasi"><TextInput type="number" value={getDeep(config, 'branding.bumperDuration', 3)} onChange={v => updateConfig('branding.bumperDuration', v)} /></Field>
        </Grid3>
        <Grid3>
          <Field label="Fade Durasi"><TextInput type="number" value={getDeep(config, 'branding.bumperFadeDuration', 0.45)} onChange={v => updateConfig('branding.bumperFadeDuration', v)} /></Field>
          <Field label="Audio Utama"><SelectInput value={getDeep(config, 'branding.bumperAudioMode', 'after-intro')} onChange={v => updateConfig('branding.bumperAudioMode', v)}><option value="after-intro">Setelah intro</option><option value="together">Bersamaan</option><option value="mute-bumper">Mute bumper</option></SelectInput></Field>
          <Field label="Status"><input readOnly value={getDeep(config, 'branding.bumperEnabled', false) ? 'Aktif' : 'Mati'} className="bg-[#070c12] border border-[#2a3545] rounded-[6px] text-[#8da0af] text-[11px] min-h-[26px] px-1.5 py-0.5 w-full" /></Field>
        </Grid3>
      </Group>

      {/* Logo Overlay */}
      <Group title="Logo Overlay">
        <Check label="Aktifkan logo" checked={Boolean(getDeep(config, 'branding.logoEnabled', true))} onChange={v => updateConfig('branding.logoEnabled', v)} />
        <Field label="File Logo"><PathInput value={getDeep(config, 'branding.logo')} onChange={v => updateConfig('branding.logo', v)} placeholder="PNG transparan direkomendasikan" filter="image" /></Field>
        <Grid3>
          <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.logoPosition', 'Kanan Atas')} onChange={v => updateConfig('branding.logoPosition', v)}>{positionOptions}</SelectInput></Field>
          <Field label="Animasi"><SelectInput value={getDeep(config, 'branding.logoAnimation', 'none')} onChange={v => updateConfig('branding.logoAnimation', v)}><option value="none">Statis</option><option value="fade">Fade in/out</option><option value="slide-left">Slide dari kanan</option><option value="slide-right">Slide dari kiri</option><option value="pulse">Pulse ringan</option><option value="zoom">Zoom ringan</option></SelectInput></Field>
          <Field label="Fade"><TextInput type="number" value={getDeep(config, 'branding.logoFadeDuration', 0.6)} onChange={v => updateConfig('branding.logoFadeDuration', v)} /></Field>
        </Grid3>
        <Grid3>
          <Field label="Mulai detik"><TextInput type="number" value={getDeep(config, 'branding.logoStart', 0)} onChange={v => updateConfig('branding.logoStart', v)} /></Field>
          <Field label="Selesai detik"><TextInput type="number" value={getDeep(config, 'branding.logoEnd', 0)} onChange={v => updateConfig('branding.logoEnd', v)} /></Field>
          <Field label="Preset"><SelectInput value="custom" onChange={v => { if (v === 'corner') { updateConfig('branding.logoPosition', 'Kanan Atas'); updateConfig('branding.logoScale', 18); } if (v === 'center') { updateConfig('branding.logoPosition', 'Tengah'); updateConfig('branding.logoScale', 35); } }}><option value="custom">Custom</option><option value="corner">Corner kecil</option><option value="center">Center besar</option></SelectInput></Field>
        </Grid3>
        <Slider label="Scale Logo" value={Number(getDeep(config, 'branding.logoScale', 18))} onChange={v => updateConfig('branding.logoScale', v)} min={5} max={100} />
        <Slider label="Opacity Logo" value={Number(getDeep(config, 'branding.logoOpacity', 100))} onChange={v => updateConfig('branding.logoOpacity', v)} min={0} max={100} />
        <Grid3>
          <Field label="Margin X"><TextInput type="number" value={getDeep(config, 'branding.logoMarginX', 20)} onChange={v => updateConfig('branding.logoMarginX', v)} /></Field>
          <Field label="Margin Y"><TextInput type="number" value={getDeep(config, 'branding.logoMarginY', 20)} onChange={v => updateConfig('branding.logoMarginY', v)} /></Field>
          <Field label="Area Aman"><input readOnly value={getDeep(config, 'branding.safeAreaPreset', 'youtube')} className="bg-[#070c12] border border-[#2a3545] rounded-[6px] text-[#8da0af] text-[11px] min-h-[26px] px-1.5 py-0.5 w-full" /></Field>
        </Grid3>
      </Group>

      {/* CTA Greenscreen */}
      <Group title="CTA Greenscreen">
        <Check label="Aktifkan CTA greenscreen" checked={Boolean(getDeep(config, 'branding.ctaEnabled', false))} onChange={v => updateConfig('branding.ctaEnabled', v)} />
        <Field label="File CTA"><PathInput value={getDeep(config, 'branding.ctaGreenscreen')} onChange={v => updateConfig('branding.ctaGreenscreen', v)} placeholder="Video greenscreen subscribe/like" filter="video" /></Field>
        <Grid3>
          <Field label="CTA Preset"><SelectInput value={getDeep(config, 'branding.ctaPreset', 'subscribe-lower-right')} onChange={applyCtaPreset}><option value="subscribe-lower-right">Subscribe lower right</option><option value="like-subscribe-bottom">Like + subscribe bottom</option><option value="bell-popup">Bell popup</option><option value="center-cta">Center CTA</option></SelectInput></Field>
          <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.ctaPosition', 'Kanan Bawah')} onChange={v => updateConfig('branding.ctaPosition', v)}>{positionOptions}</SelectInput></Field>
          <Field label="Muncul detik"><TextInput type="number" value={getDeep(config, 'branding.ctaAt', 2)} onChange={v => updateConfig('branding.ctaAt', v)} /></Field>
        </Grid3>
        <Grid3>
          <Field label="Durasi"><TextInput type="number" value={getDeep(config, 'branding.ctaDuration', 8)} onChange={v => updateConfig('branding.ctaDuration', v)} /></Field>
          <Field label="Chroma Preset"><SelectInput value={getDeep(config, 'branding.ctaChromaPreset', 'green')} onChange={v => { updateConfig('branding.ctaChromaPreset', v); if (v === 'green') updateConfig('branding.ctaChromaColor', '0x00ff00'); if (v === 'blue') updateConfig('branding.ctaChromaColor', '0x0000ff'); }}><option value="green">Auto Green</option><option value="blue">Auto Blue</option><option value="manual">Manual</option><option value="auto">Auto Soft</option></SelectInput></Field>
          <Field label="Chroma Color"><TextInput value={getDeep(config, 'branding.ctaChromaColor', '0x00ff00')} onChange={v => updateConfig('branding.ctaChromaColor', v)} /></Field>
        </Grid3>
        <Slider label="Scale CTA" value={Number(getDeep(config, 'branding.ctaScale', 26))} onChange={v => updateConfig('branding.ctaScale', v)} min={5} max={100} />
        <Grid3>
          <Field label="Similarity"><TextInput type="number" value={getDeep(config, 'branding.ctaSimilarity', 0.35)} onChange={v => updateConfig('branding.ctaSimilarity', v)} /></Field>
          <Field label="Blend"><TextInput type="number" value={getDeep(config, 'branding.ctaBlend', 0.08)} onChange={v => updateConfig('branding.ctaBlend', v)} /></Field>
          <Field label="Status"><input readOnly value={getDeep(config, 'branding.ctaEnabled', false) ? 'Aktif' : 'Mati'} className="bg-[#070c12] border border-[#2a3545] rounded-[6px] text-[#8da0af] text-[11px] min-h-[26px] px-1.5 py-0.5 w-full" /></Field>
        </Grid3>
      </Group>

      {/* Watermark & Layer */}
      <Group title="Watermark & Layer">
        <Check label="Aktifkan watermark teks" checked={Boolean(getDeep(config, 'branding.watermarkEnabled', false))} onChange={v => updateConfig('branding.watermarkEnabled', v)} />
        <Field label="Teks"><TextInput value={getDeep(config, 'branding.watermarkText', '')} onChange={v => updateConfig('branding.watermarkText', v)} placeholder="@channel / brand name" /></Field>
        <Grid3>
          <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah')} onChange={v => updateConfig('branding.watermarkPosition', v)}>{positionOptions}</SelectInput></Field>
          <Field label="Opacity"><TextInput type="number" value={getDeep(config, 'branding.watermarkOpacity', 70)} onChange={v => updateConfig('branding.watermarkOpacity', v)} /></Field>
          <Field label="Mode"><SelectInput value={getDeep(config, 'branding.watermarkMode', 'always')} onChange={v => updateConfig('branding.watermarkMode', v)}><option value="always">Selalu tampil</option><option value="interval">Muncul interval</option></SelectInput></Field>
        </Grid3>
        <Grid3>
          <Field label="Interval"><TextInput type="number" value={getDeep(config, 'branding.watermarkInterval', 12)} onChange={v => updateConfig('branding.watermarkInterval', v)} /></Field>
          <Field label="Durasi Tampil"><TextInput type="number" value={getDeep(config, 'branding.watermarkVisibleDuration', 5)} onChange={v => updateConfig('branding.watermarkVisibleDuration', v)} /></Field>
          <Field label="Layer Order"><TextInput value={getDeep(config, 'branding.layerOrder', 'bumper,particle,logo,cta,spectrum,lyrics,watermark')} onChange={v => updateConfig('branding.layerOrder', v)} /></Field>
        </Grid3>
      </Group>
    </PanelWrap>
  );
}
