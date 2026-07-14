import React, { useState } from 'react';
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
    <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Branding & Overlay</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Logo, bumper, CTA, dan watermark</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Toolbar + control card */}
        <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] space-y-3">
          <div className="flex gap-2 flex-wrap">
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
            <button
              onClick={validateBranding}
              disabled={busy}
              className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
            >
              Validasi Aset
            </button>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[11px] text-[var(--text-muted)]">
            <span className="text-[var(--accent-primary)]">💡</span>
            <span>Edit posisi branding langsung di layar PREVIEW kanan. Geser logo, CTA, atau watermark; klik watermark untuk ubah teks.</span>
          </div>
          {message && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium', validation?.ok ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]')}>
              {cleanUiText(message)}
            </div>
          )}
          {validation?.warnings?.length ? (
            <div className="p-4 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
              <h4 className="text-[12px] font-bold text-[var(--accent-warning)] mb-3">⚠ Catatan aset:</h4>
              <ul className="space-y-2">
                {validation.warnings.map((warning: string, i: number) => (
                  <li key={i} className="text-[11px] text-[var(--text-primary)] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Bumper Video */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Bumper Video</h3>
          <Check label="Aktifkan bumper" checked={Boolean(getDeep(config, 'branding.bumperEnabled', false))} onChange={v => updateConfig('branding.bumperEnabled', v)} />
          <Field label="File Bumper"><PathInput value={getDeep(config, 'branding.bumperVideo')} onChange={v => updateConfig('branding.bumperVideo', v)} placeholder="C:/brand/intro-outro.mp4" filter="video" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.bumperPosition', 'Akhir')} onChange={v => updateConfig('branding.bumperPosition', v)}><option>Awal</option><option>Akhir</option><option>Keduanya</option></SelectInput></Field>
            <Field label="Transisi"><SelectInput value={getDeep(config, 'branding.bumperTransition', 'fade')} onChange={v => updateConfig('branding.bumperTransition', v)}><option>fade</option><option>cut</option><option>overlay</option></SelectInput></Field>
            <Field label="Durasi"><TextInput type="number" value={getDeep(config, 'branding.bumperDuration', 3)} onChange={v => updateConfig('branding.bumperDuration', v)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Fade Durasi"><TextInput type="number" value={getDeep(config, 'branding.bumperFadeDuration', 0.45)} onChange={v => updateConfig('branding.bumperFadeDuration', v)} /></Field>
            <Field label="Audio Utama"><SelectInput value={getDeep(config, 'branding.bumperAudioMode', 'after-intro')} onChange={v => updateConfig('branding.bumperAudioMode', v)}><option value="after-intro">Setelah intro</option><option value="together">Bersamaan</option><option value="mute-bumper">Mute bumper</option></SelectInput></Field>
            <Field label="Status"><input readOnly value={getDeep(config, 'branding.bumperEnabled', false) ? 'Aktif' : 'Mati'} className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1 w-full" /></Field>
          </div>
        </div>

        {/* Logo Overlay */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Logo Overlay</h3>
          <Check label="Aktifkan logo" checked={Boolean(getDeep(config, 'branding.logoEnabled', true))} onChange={v => updateConfig('branding.logoEnabled', v)} />
          <Field label="File Logo"><PathInput value={getDeep(config, 'branding.logo')} onChange={v => updateConfig('branding.logo', v)} placeholder="PNG transparan direkomendasikan" filter="image" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.logoPosition', 'Kanan Atas')} onChange={v => updateConfig('branding.logoPosition', v)}>{positionOptions}</SelectInput></Field>
            <Field label="Animasi"><SelectInput value={getDeep(config, 'branding.logoAnimation', 'none')} onChange={v => updateConfig('branding.logoAnimation', v)}><option value="none">Statis</option><option value="fade">Fade in/out</option><option value="slide-left">Slide dari kanan</option><option value="slide-right">Slide dari kiri</option><option value="pulse">Pulse ringan</option><option value="zoom">Zoom ringan</option></SelectInput></Field>
            <Field label="Fade"><TextInput type="number" value={getDeep(config, 'branding.logoFadeDuration', 0.6)} onChange={v => updateConfig('branding.logoFadeDuration', v)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mulai detik"><TextInput type="number" value={getDeep(config, 'branding.logoStart', 0)} onChange={v => updateConfig('branding.logoStart', v)} /></Field>
            <Field label="Selesai detik"><TextInput type="number" value={getDeep(config, 'branding.logoEnd', 0)} onChange={v => updateConfig('branding.logoEnd', v)} /></Field>
            <Field label="Preset"><SelectInput value="custom" onChange={v => { if (v === 'corner') { updateConfig('branding.logoPosition', 'Kanan Atas'); updateConfig('branding.logoScale', 18); } if (v === 'center') { updateConfig('branding.logoPosition', 'Tengah'); updateConfig('branding.logoScale', 35); } }}><option value="custom">Custom</option><option value="corner">Corner kecil</option><option value="center">Center besar</option></SelectInput></Field>
          </div>
          <Slider label="Scale Logo" value={Number(getDeep(config, 'branding.logoScale', 18))} onChange={v => updateConfig('branding.logoScale', v)} min={5} max={100} />
          <Slider label="Opacity Logo" value={Number(getDeep(config, 'branding.logoOpacity', 100))} onChange={v => updateConfig('branding.logoOpacity', v)} min={0} max={100} />
          
          {/* Advanced Logo Effects */}
          <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Advanced Logo Effects</h4>
            <Check label="Enable Glow Effect" checked={Boolean(getDeep(config, 'branding.logoGlow', false))} onChange={v => updateConfig('branding.logoGlow', v)} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Glow Color">
                <TextInput value={getDeep(config, 'branding.logoGlowColor', '#ffffff')} onChange={v => updateConfig('branding.logoGlowColor', v)} />
              </Field>
              <Field label="Glow Strength">
                <TextInput type="number" value={getDeep(config, 'branding.logoGlowStrength', 15)} onChange={v => updateConfig('branding.logoGlowStrength', v)} placeholder="5-50" />
              </Field>
              <Field label="Glow Blur">
                <TextInput type="number" value={getDeep(config, 'branding.logoGlowBlur', 10)} onChange={v => updateConfig('branding.logoGlowBlur', v)} placeholder="5-30" />
              </Field>
            </div>
            <Check label="Enable Shadow" checked={Boolean(getDeep(config, 'branding.logoShadow', true))} onChange={v => updateConfig('branding.logoShadow', v)} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Shadow Color">
                <TextInput value={getDeep(config, 'branding.logoShadowColor', '#000000')} onChange={v => updateConfig('branding.logoShadowColor', v)} />
              </Field>
              <Field label="Shadow Blur">
                <TextInput type="number" value={getDeep(config, 'branding.logoShadowBlur', 8)} onChange={v => updateConfig('branding.logoShadowBlur', v)} placeholder="0-20" />
              </Field>
              <Field label="Shadow Offset">
                <TextInput type="number" value={getDeep(config, 'branding.logoShadowOffset', 4)} onChange={v => updateConfig('branding.logoShadowOffset', v)} placeholder="0-10" />
              </Field>
            </div>
            <Check label="Enable Border" checked={Boolean(getDeep(config, 'branding.logoBorder', false))} onChange={v => updateConfig('branding.logoBorder', v)} />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Border Color">
                <TextInput value={getDeep(config, 'branding.logoBorderColor', '#ffffff')} onChange={v => updateConfig('branding.logoBorderColor', v)} />
              </Field>
              <Field label="Border Width">
                <TextInput type="number" value={getDeep(config, 'branding.logoBorderWidth', 2)} onChange={v => updateConfig('branding.logoBorderWidth', v)} placeholder="1-10" />
              </Field>
              <Field label="Border Style">
                <SelectInput value={getDeep(config, 'branding.logoBorderStyle', 'solid')} onChange={v => updateConfig('branding.logoBorderStyle', v)}>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </SelectInput>
              </Field>
            </div>
            <Check label="Enable 3D Effect" checked={Boolean(getDeep(config, 'branding.logo3D', false))} onChange={v => updateConfig('branding.logo3D', v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="3D Depth">
                <TextInput type="number" value={getDeep(config, 'branding.logo3DDepth', 5)} onChange={v => updateConfig('branding.logo3DDepth', v)} placeholder="1-20" />
              </Field>
              <Field label="3D Angle">
                <TextInput type="number" value={getDeep(config, 'branding.logo3DAngle', 45)} onChange={v => updateConfig('branding.logo3DAngle', v)} placeholder="0-360" />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Margin X"><TextInput type="number" value={getDeep(config, 'branding.logoMarginX', 20)} onChange={v => updateConfig('branding.logoMarginX', v)} /></Field>
            <Field label="Margin Y"><TextInput type="number" value={getDeep(config, 'branding.logoMarginY', 20)} onChange={v => updateConfig('branding.logoMarginY', v)} /></Field>
            <Field label="Area Aman"><input readOnly value={getDeep(config, 'branding.safeAreaPreset', 'youtube')} className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1 w-full" /></Field>
          </div>
        </div>

        {/* CTA Greenscreen */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">CTA Greenscreen</h3>
          <Check label="Aktifkan CTA greenscreen" checked={Boolean(getDeep(config, 'branding.ctaEnabled', false))} onChange={v => updateConfig('branding.ctaEnabled', v)} />
          <Field label="File CTA"><PathInput value={getDeep(config, 'branding.ctaGreenscreen')} onChange={v => updateConfig('branding.ctaGreenscreen', v)} placeholder="Video greenscreen subscribe/like" filter="video" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="CTA Preset"><SelectInput value={getDeep(config, 'branding.ctaPreset', 'subscribe-lower-right')} onChange={applyCtaPreset}><option value="subscribe-lower-right">Subscribe lower right</option><option value="like-subscribe-bottom">Like + subscribe bottom</option><option value="bell-popup">Bell popup</option><option value="center-cta">Center CTA</option></SelectInput></Field>
            <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.ctaPosition', 'Kanan Bawah')} onChange={v => updateConfig('branding.ctaPosition', v)}>{positionOptions}</SelectInput></Field>
            <Field label="Muncul detik"><TextInput type="number" value={getDeep(config, 'branding.ctaAt', 2)} onChange={v => updateConfig('branding.ctaAt', v)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Durasi"><TextInput type="number" value={getDeep(config, 'branding.ctaDuration', 8)} onChange={v => updateConfig('branding.ctaDuration', v)} /></Field>
            <Field label="Chroma Preset"><SelectInput value={getDeep(config, 'branding.ctaChromaPreset', 'green')} onChange={v => { updateConfig('branding.ctaChromaPreset', v); if (v === 'green') updateConfig('branding.ctaChromaColor', '0x00ff00'); if (v === 'blue') updateConfig('branding.ctaChromaColor', '0x0000ff'); }}><option value="green">Auto Green</option><option value="blue">Auto Blue</option><option value="manual">Manual</option><option value="auto">Auto Soft</option></SelectInput></Field>
            <Field label="Chroma Color"><TextInput value={getDeep(config, 'branding.ctaChromaColor', '0x00ff00')} onChange={v => updateConfig('branding.ctaChromaColor', v)} /></Field>
          </div>
          <Slider label="Scale CTA" value={Number(getDeep(config, 'branding.ctaScale', 26))} onChange={v => updateConfig('branding.ctaScale', v)} min={5} max={100} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Similarity"><TextInput type="number" value={getDeep(config, 'branding.ctaSimilarity', 0.35)} onChange={v => updateConfig('branding.ctaSimilarity', v)} /></Field>
            <Field label="Blend"><TextInput type="number" value={getDeep(config, 'branding.ctaBlend', 0.08)} onChange={v => updateConfig('branding.ctaBlend', v)} /></Field>
            <Field label="Status"><input readOnly value={getDeep(config, 'branding.ctaEnabled', false) ? 'Aktif' : 'Mati'} className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1 w-full" /></Field>
          </div>
        </div>

        {/* Animated Text Overlays */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Animated Text Overlays</h3>
          <Check label="Enable Text Overlays" checked={Boolean(getDeep(config, 'branding.textOverlay.enabled', false))} onChange={v => updateConfig('branding.textOverlay.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Overlay Type">
              <SelectInput value={getDeep(config, 'branding.textOverlay.type', 'lower-third')} onChange={v => updateConfig('branding.textOverlay.type', v)}>
                <option value="lower-third">Lower Third</option>
                <option value="title">Title</option>
                <option value="caption">Caption</option>
                <option value="banner">Banner</option>
                <option value="corner-tag">Corner Tag</option>
              </SelectInput>
            </Field>
            <Field label="Animation">
              <SelectInput value={getDeep(config, 'branding.textOverlay.animation', 'slide-in')} onChange={v => updateConfig('branding.textOverlay.animation', v)}>
                <option value="slide-in">Slide In</option>
                <option value="fade">Fade</option>
                <option value="typewriter">Typewriter</option>
                <option value="bounce">Bounce</option>
                <option value="zoom">Zoom</option>
              </SelectInput>
            </Field>
            <Field label="Position">
              <SelectInput value={getDeep(config, 'branding.textOverlay.position', 'bottom')} onChange={v => updateConfig('branding.textOverlay.position', v)}>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="center">Center</option>
              </SelectInput>
            </Field>
          </div>
          <Field label="Primary Text">
            <TextInput value={getDeep(config, 'branding.textOverlay.primaryText', '')} onChange={v => updateConfig('branding.textOverlay.primaryText', v)} placeholder="Main title or name" />
          </Field>
          <Field label="Secondary Text">
            <TextInput value={getDeep(config, 'branding.textOverlay.secondaryText', '')} onChange={v => updateConfig('branding.textOverlay.secondaryText', v)} placeholder="Subtitle or description" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Show At (s)">
              <TextInput type="number" value={getDeep(config, 'branding.textOverlay.showAt', 1)} onChange={v => updateConfig('branding.textOverlay.showAt', v)} />
            </Field>
            <Field label="Duration (s)">
              <TextInput type="number" value={getDeep(config, 'branding.textOverlay.duration', 5)} onChange={v => updateConfig('branding.textOverlay.duration', v)} />
            </Field>
            <Field label="Font Size">
              <TextInput type="number" value={getDeep(config, 'branding.textOverlay.fontSize', 32)} onChange={v => updateConfig('branding.textOverlay.fontSize', v)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Background Color">
              <TextInput value={getDeep(config, 'branding.textOverlay.bgColor', '#000000')} onChange={v => updateConfig('branding.textOverlay.bgColor', v)} />
            </Field>
            <Field label="Text Color">
              <TextInput value={getDeep(config, 'branding.textOverlay.textColor', '#ffffff')} onChange={v => updateConfig('branding.textOverlay.textColor', v)} />
            </Field>
          </div>
          <Slider label="Background Opacity" value={Number(getDeep(config, 'branding.textOverlay.bgOpacity', 80))} onChange={v => updateConfig('branding.textOverlay.bgOpacity', v)} min={0} max={100} />
        </div>

        {/* Social Media Badges */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Social Media Badges</h3>
          <Check label="Enable Social Badges" checked={Boolean(getDeep(config, 'branding.socialBadges.enabled', false))} onChange={v => updateConfig('branding.socialBadges.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Badge Style">
              <SelectInput value={getDeep(config, 'branding.socialBadges.style', 'modern')} onChange={v => updateConfig('branding.socialBadges.style', v)}>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="classic">Classic</option>
                <option value="neon">Neon</option>
              </SelectInput>
            </Field>
            <Field label="Position">
              <SelectInput value={getDeep(config, 'branding.socialBadges.position', 'bottom-left')} onChange={v => updateConfig('branding.socialBadges.position', v)}>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </SelectInput>
            </Field>
            <Field label="Layout">
              <SelectInput value={getDeep(config, 'branding.socialBadges.layout', 'horizontal')} onChange={v => updateConfig('branding.socialBadges.layout', v)}>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="stacked">Stacked</option>
              </SelectInput>
            </Field>
          </div>
          <Field label="Instagram Handle">
            <TextInput value={getDeep(config, 'branding.socialBadges.instagram', '')} onChange={v => updateConfig('branding.socialBadges.instagram', v)} placeholder="@username" />
          </Field>
          <Field label="TikTok Handle">
            <TextInput value={getDeep(config, 'branding.socialBadges.tiktok', '')} onChange={v => updateConfig('branding.socialBadges.tiktok', v)} placeholder="@username" />
          </Field>
          <Field label="YouTube Channel">
            <TextInput value={getDeep(config, 'branding.socialBadges.youtube', '')} onChange={v => updateConfig('branding.socialBadges.youtube', v)} placeholder="@channelname" />
          </Field>
          <Field label="Twitter/X Handle">
            <TextInput value={getDeep(config, 'branding.socialBadges.twitter', '')} onChange={v => updateConfig('branding.socialBadges.twitter', v)} placeholder="@username" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Icon Size">
              <TextInput type="number" value={getDeep(config, 'branding.socialBadges.iconSize', 24)} onChange={v => updateConfig('branding.socialBadges.iconSize', v)} placeholder="16-48" />
            </Field>
            <Field label="Show At (s)">
              <TextInput type="number" value={getDeep(config, 'branding.socialBadges.showAt', 3)} onChange={v => updateConfig('branding.socialBadges.showAt', v)} />
            </Field>
            <Field label="Duration (s)">
              <TextInput type="number" value={getDeep(config, 'branding.socialBadges.duration', 0)} onChange={v => updateConfig('branding.socialBadges.duration', v)} placeholder="0 = always" />
            </Field>
          </div>
          <Check label="Animated Icons" checked={Boolean(getDeep(config, 'branding.socialBadges.animated', true))} onChange={v => updateConfig('branding.socialBadges.animated', v)} />
        </div>

        {/* Watermark & Layer */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Watermark & Layer</h3>
          <Check label="Aktifkan watermark teks" checked={Boolean(getDeep(config, 'branding.watermarkEnabled', false))} onChange={v => updateConfig('branding.watermarkEnabled', v)} />
          <Field label="Teks"><TextInput value={getDeep(config, 'branding.watermarkText', '')} onChange={v => updateConfig('branding.watermarkText', v)} placeholder="@channel / brand name" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Posisi"><SelectInput value={getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah')} onChange={v => updateConfig('branding.watermarkPosition', v)}>{positionOptions}</SelectInput></Field>
            <Field label="Opacity"><TextInput type="number" value={getDeep(config, 'branding.watermarkOpacity', 70)} onChange={v => updateConfig('branding.watermarkOpacity', v)} /></Field>
            <Field label="Mode"><SelectInput value={getDeep(config, 'branding.watermarkMode', 'always')} onChange={v => updateConfig('branding.watermarkMode', v)}><option value="always">Selalu tampil</option><option value="interval">Muncul interval</option></SelectInput></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Interval"><TextInput type="number" value={getDeep(config, 'branding.watermarkInterval', 12)} onChange={v => updateConfig('branding.watermarkInterval', v)} /></Field>
            <Field label="Durasi Tampil"><TextInput type="number" value={getDeep(config, 'branding.watermarkVisibleDuration', 5)} onChange={v => updateConfig('branding.watermarkVisibleDuration', v)} /></Field>
            <Field label="Layer Order"><TextInput value={getDeep(config, 'branding.layerOrder', 'bumper,particle,logo,cta,spectrum,lyrics,watermark')} onChange={v => updateConfig('branding.layerOrder', v)} /></Field>
          </div>
        </div>

        {/* Brand Color Palette */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Brand Color Palette</h3>
          <Check label="Enable Brand Colors" checked={Boolean(getDeep(config, 'branding.brandColors.enabled', false))} onChange={v => updateConfig('branding.brandColors.enabled', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Primary Color">
              <TextInput value={getDeep(config, 'branding.brandColors.primary', '#3b82f6')} onChange={v => updateConfig('branding.brandColors.primary', v)} />
            </Field>
            <Field label="Secondary Color">
              <TextInput value={getDeep(config, 'branding.brandColors.secondary', '#8b5cf6')} onChange={v => updateConfig('branding.brandColors.secondary', v)} />
            </Field>
            <Field label="Accent Color">
              <TextInput value={getDeep(config, 'branding.brandColors.accent', '#f59e0b')} onChange={v => updateConfig('branding.brandColors.accent', v)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Background Color">
              <TextInput value={getDeep(config, 'branding.brandColors.background', '#000000')} onChange={v => updateConfig('branding.brandColors.background', v)} />
            </Field>
            <Field label="Text Color">
              <TextInput value={getDeep(config, 'branding.brandColors.text', '#ffffff')} onChange={v => updateConfig('branding.brandColors.text', v)} />
            </Field>
          </div>
          <Check label="Apply to All Elements" checked={Boolean(getDeep(config, 'branding.brandColors.applyToAll', false))} onChange={v => updateConfig('branding.brandColors.applyToAll', v)} />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { updateConfig('branding.brandColors.primary', '#3b82f6'); updateConfig('branding.brandColors.secondary', '#8b5cf6'); updateConfig('branding.brandColors.accent', '#f59e0b'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Blue Theme</button>
            <button onClick={() => { updateConfig('branding.brandColors.primary', '#ef4444'); updateConfig('branding.brandColors.secondary', '#f97316'); updateConfig('branding.brandColors.accent', '#fbbf24'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Red Theme</button>
            <button onClick={() => { updateConfig('branding.brandColors.primary', '#10b981'); updateConfig('branding.brandColors.secondary', '#14b8a6'); updateConfig('branding.brandColors.accent', '#06b6d4'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Green Theme</button>
            <button onClick={() => { updateConfig('branding.brandColors.primary', '#ec4899'); updateConfig('branding.brandColors.secondary', '#a855f7'); updateConfig('branding.brandColors.accent', '#f472b6'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Pink Theme</button>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Brand colors akan diterapkan ke logo glow, text overlays, social badges, dan elemen branding lainnya untuk konsistensi visual.
          </div>
        </div>

        {/* Template System */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Branding Templates</h3>
          <Field label="Template Preset">
            <SelectInput value={getDeep(config, 'branding.template', 'custom')} onChange={v => {
              updateConfig('branding.template', v);
              if (v === 'youtube-pro') {
                updateConfig('branding.logoEnabled', true);
                updateConfig('branding.logoPosition', 'Kanan Atas');
                updateConfig('branding.logoScale', 18);
                updateConfig('branding.ctaEnabled', true);
                updateConfig('branding.ctaPosition', 'Kanan Bawah');
                updateConfig('branding.textOverlay.enabled', true);
                updateConfig('branding.textOverlay.type', 'lower-third');
                updateConfig('branding.brandColors.primary', '#ff0000');
              }
              if (v === 'tiktok-viral') {
                updateConfig('branding.logoEnabled', true);
                updateConfig('branding.logoPosition', 'Kanan Atas');
                updateConfig('branding.logoScale', 22);
                updateConfig('branding.socialBadges.enabled', true);
                updateConfig('branding.socialBadges.position', 'bottom-left');
                updateConfig('branding.textOverlay.enabled', true);
                updateConfig('branding.textOverlay.type', 'caption');
                updateConfig('branding.brandColors.primary', '#fe2c55');
              }
              if (v === 'instagram-clean') {
                updateConfig('branding.logoEnabled', true);
                updateConfig('branding.logoPosition', 'Tengah');
                updateConfig('branding.logoScale', 35);
                updateConfig('branding.logoAnimation', 'fade');
                updateConfig('branding.socialBadges.enabled', true);
                updateConfig('branding.brandColors.primary', '#e1306c');
              }
              if (v === 'podcast-minimal') {
                updateConfig('branding.logoEnabled', true);
                updateConfig('branding.logoPosition', 'Kiri Atas');
                updateConfig('branding.logoScale', 20);
                updateConfig('branding.textOverlay.enabled', true);
                updateConfig('branding.textOverlay.type', 'lower-third');
                updateConfig('branding.watermarkEnabled', true);
                updateConfig('branding.brandColors.primary', '#1db954');
              }
              if (v === 'gaming-stream') {
                updateConfig('branding.logoEnabled', true);
                updateConfig('branding.logoGlow', true);
                updateConfig('branding.logoPosition', 'Kanan Atas');
                updateConfig('branding.ctaEnabled', true);
                updateConfig('branding.socialBadges.enabled', true);
                updateConfig('branding.textOverlay.enabled', true);
                updateConfig('branding.brandColors.primary', '#9146ff');
              }
            }}>
              <option value="custom">Custom</option>
              <option value="youtube-pro">YouTube Professional</option>
              <option value="tiktok-viral">TikTok Viral</option>
              <option value="instagram-clean">Instagram Clean</option>
              <option value="podcast-minimal">Podcast Minimal</option>
              <option value="gaming-stream">Gaming Stream</option>
            </SelectInput>
          </Field>
          <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">Template Features:</h4>
            <ul className="space-y-1.5 text-[10px] text-[var(--text-muted)]">
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">YouTube Pro: Logo + CTA + Lower Third + Watermark</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">TikTok Viral: Logo + Social Badges + Captions</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">Instagram Clean: Centered Logo + Social Badges</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">Podcast Minimal: Logo + Lower Third + Watermark</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">Gaming Stream: Logo Glow + CTA + Social + Overlays</li>
            </ul>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Templates mengatur semua elemen branding sekaligus. Pilih template lalu customize sesuai kebutuhan.
          </div>
        </div>
      </div>
    </aside>
  );
}
