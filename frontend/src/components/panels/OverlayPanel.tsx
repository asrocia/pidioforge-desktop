import { useState } from 'react';
import { Field, Check, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText, errorMessage } from '../../lib/format';
import { detectTargetFormat, applyOverlayFormatPreset } from '../../utils/format-presets';
import { ActionButtonGroup, Callout, Card, SliderControl, WarningList } from '../ui/design-system-components';
import type { PidioConfig } from '../../types/app.types';

type OverlayValidation = { ok?: boolean; warnings?: string[] };

export function OverlayPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<OverlayValidation | null>(null);
  const [busy, setBusy] = useState(false);
  const format = detectTargetFormat(config);
  function applyPreset(v: string) {
    updateConfig('overlay.stylePreset', v);
    if (v === 'clean') {
      updateConfig('overlay.vignette', false);
      updateConfig('overlay.filmGrain', false);
      updateConfig('overlay.scanlines', false);
      updateConfig('overlay.frameBorder', false);
      updateConfig('overlay.darken', false);
      updateConfig('overlay.letterbox', false);
    }
    if (v === 'cinematic') {
      updateConfig('overlay.vignette', true);
      updateConfig('overlay.vignetteStrength', 0.45);
      updateConfig('overlay.filmGrain', true);
      updateConfig('overlay.grainStrength', 8);
      updateConfig('overlay.letterbox', true);
      updateConfig('overlay.letterboxSize', 72);
      updateConfig('overlay.darken', true);
      updateConfig('overlay.darkenOpacity', 10);
    }
    if (v === 'live-stream') {
      updateConfig('overlay.timestamp', true);
      updateConfig('overlay.frameBorder', true);
      updateConfig('overlay.borderColor', '#22c55e');
      updateConfig('overlay.borderThickness', 4);
      updateConfig('overlay.lowerThirdEnabled', true);
      updateConfig('overlay.lowerThirdPosition', 'Bawah');
    }
    if (v === 'retro') {
      updateConfig('overlay.scanlines', true);
      updateConfig('overlay.scanlineOpacity', 8);
      updateConfig('overlay.filmGrain', true);
      updateConfig('overlay.grainStrength', 14);
      updateConfig('overlay.vignette', true);
      updateConfig('overlay.vignetteStrength', 0.3);
    }
    if (v === 'dark-focus') {
      updateConfig('overlay.darken', true);
      updateConfig('overlay.darkenOpacity', 22);
      updateConfig('overlay.vignette', true);
      updateConfig('overlay.vignetteStrength', 0.5);
    }
  }
  async function validateOverlay() {
    setBusy(true);
    setMessage('Memeriksa overlay...');
    try {
      const data = await api('/api/overlay/validate', { method: 'POST', body: JSON.stringify({ config }) });
      setValidation(data);
      setMessage(data.ok ? 'Overlay siap digunakan.' : `Perlu perhatian: ${(data.warnings || []).join(' ')}`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      {/* Preview Area */}
      <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] space-y-3">
        <div className="relative h-[84px] rounded-[var(--radius-md)] overflow-hidden bg-[var(--tertiary-bg)] border border-[var(--border-subtle)]">
          {getDeep(config, 'overlay.timestamp', false) && (
            <span
              className={`absolute text-[10px] px-2 py-0.5 bg-black/50 rounded-sm ${getDeep(config, 'overlay.timestampPosition', 'Kiri Atas').replaceAll(' ', '-')}`}
            >
              {getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')}
            </span>
          )}
          {getDeep(config, 'overlay.lowerThirdEnabled', false) && (
            <span className="absolute bottom-2 left-2 text-[9px] px-2 py-0.5 bg-black/50 rounded-sm text-white">
              {getDeep(config, 'overlay.lowerThirdText', 'LOWER THIRD')}
            </span>
          )}
          {getDeep(config, 'overlay.frameBorder', false) && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                borderColor: getDeep(config, 'overlay.borderColor', 'white'),
                borderWidth: `${getDeep(config, 'overlay.borderThickness', 6)}px`,
              }}
            />
          )}
          {getDeep(config, 'overlay.letterbox', false) && (
            <>
              <span className="absolute top-0 left-0 right-0 h-[30%] bg-black/60 pointer-events-none" />
              <span className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/60 pointer-events-none" />
            </>
          )}
          {getDeep(config, 'overlay.scanlines', false) && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)',
              }}
            />
          )}
          {getDeep(config, 'overlay.darken', false) && (
            <span className="absolute inset-0 bg-black/20 pointer-events-none" />
          )}
        </div>
        <div className="space-y-2">
          <Field label="Style Preset">
            <SelectInput value={getDeep(config, 'overlay.stylePreset', 'clean')} onChange={applyPreset}>
              <option value="clean">Clean</option>
              <option value="cinematic">Cinematic</option>
              <option value="live-stream">Live Stream</option>
              <option value="retro">Retro Scanline</option>
              <option value="dark-focus">Dark Focus</option>
            </SelectInput>
          </Field>
          <ActionButtonGroup
            actions={[
              {
                id: 'format',
                label: `Format ${format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9'}`,
                icon: '📐',
                variant: 'secondary',
                onClick: () => applyOverlayFormatPreset(updateConfig, format),
              },
              {
                id: 'validate',
                label: 'Cek Overlay',
                icon: '✅',
                variant: 'primary',
                disabled: busy,
                onClick: validateOverlay,
              },
            ]}
          />
        </div>
        {message && (
          <div
            className={cn(
              'px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium border',
              validation?.ok
                ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--accent-success)]/20'
                : 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border-[var(--accent-warning)]/20',
            )}
            role="status"
            aria-live="polite"
          >
            {cleanUiText(message)}
          </div>
        )}
        {validation?.warnings?.length ? (
          <WarningList
            tone="warning"
            title="Catatan overlay"
            items={validation.warnings.map((w: string) => cleanUiText(w))}
          />
        ) : null}
      </div>

      {/* Particle & Asset */}
      <Card title="Particle & Asset">
        <Check
          label="Video Partikel"
          checked={Boolean(getDeep(config, 'overlay.videoParticle', true))}
          onChange={v => updateConfig('overlay.videoParticle', v)}
        />
        <Field label="File Partikel">
          <PathInput
            value={getDeep(config, 'overlay.particleFile')}
            onChange={v => updateConfig('overlay.particleFile', v)}
            placeholder="Video particle / light leak"
            filter="video"
          />
        </Field>
        <SliderControl
          label="Opacity Partikel"
          value={Number(getDeep(config, 'overlay.particleOpacity', 70))}
          onChange={v => updateConfig('overlay.particleOpacity', v)}
          min={0}
          max={100}
        />
        <Field label="Kecepatan">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.particleSpeed', 100)}
            onChange={v => updateConfig('overlay.particleSpeed', v)}
          />
        </Field>
        <Field label="Campur">
          <SelectInput
            value={getDeep(config, 'overlay.particleBlend', 'normal')}
            onChange={v => updateConfig('overlay.particleBlend', v)}
          >
            <option>normal</option>
            <option>screen</option>
            <option>add</option>
          </SelectInput>
        </Field>
        <Field label="Transisi Lagu">
          <SelectInput
            value={getDeep(config, 'overlay.songTransition', 'fade')}
            onChange={v => updateConfig('overlay.songTransition', v)}
          >
            <option>fade</option>
            <option>cut</option>
            <option>mix</option>
          </SelectInput>
        </Field>
        <Check
          label="Overlay asset tambahan"
          checked={Boolean(getDeep(config, 'overlay.overlayEnabled', false))}
          onChange={v => updateConfig('overlay.overlayEnabled', v)}
        />
        <Field label="File Overlay">
          <PathInput
            value={getDeep(config, 'overlay.overlayFile', '')}
            onChange={v => updateConfig('overlay.overlayFile', v)}
            placeholder="PNG/video overlay"
            filter="visual"
          />
        </Field>
        <Field label="Posisi">
          <SelectInput
            value={getDeep(config, 'overlay.overlayPosition', 'Tengah')}
            onChange={v => updateConfig('overlay.overlayPosition', v)}
          >
            <option>Tengah</option>
            <option>Kanan Atas</option>
            <option>Kiri Atas</option>
            <option>Kanan Bawah</option>
            <option>Kiri Bawah</option>
          </SelectInput>
        </Field>
        <Field label="Mulai">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.overlayStart', 0)}
            onChange={v => updateConfig('overlay.overlayStart', v)}
          />
        </Field>
        <Field label="Selesai">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.overlayEnd', 0)}
            onChange={v => updateConfig('overlay.overlayEnd', v)}
          />
        </Field>
        <SliderControl
          label="Opacity Overlay"
          value={Number(getDeep(config, 'overlay.overlayOpacity', 80))}
          onChange={v => updateConfig('overlay.overlayOpacity', v)}
          min={0}
          max={100}
        />
        <SliderControl
          label="Skala Overlay"
          value={Number(getDeep(config, 'overlay.overlayScale', 100))}
          onChange={v => updateConfig('overlay.overlayScale', v)}
          min={5}
          max={160}
        />
      </Card>

      {/* Teks Overlay */}
      <Card title="Teks Overlay">
        <Check
          label="Timestamp / Label"
          checked={Boolean(getDeep(config, 'overlay.timestamp', false))}
          onChange={v => updateConfig('overlay.timestamp', v)}
        />
        <Field label="Text">
          <TextInput
            value={getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')}
            onChange={v => updateConfig('overlay.timestampText', v)}
          />
        </Field>
        <Field label="Posisi">
          <SelectInput
            value={getDeep(config, 'overlay.timestampPosition', 'Kiri Atas')}
            onChange={v => updateConfig('overlay.timestampPosition', v)}
          >
            <option>Kiri Atas</option>
            <option>Kanan Atas</option>
            <option>Kiri Bawah</option>
            <option>Kanan Bawah</option>
          </SelectInput>
        </Field>
        <Field label="Playlist">
          <SelectInput
            value={getDeep(config, 'overlay.playlist', true) ? 'Aktif' : 'Mati'}
            onChange={v => updateConfig('overlay.playlist', v === 'Aktif')}
          >
            <option value="Aktif">Aktif</option>
            <option value="Mati">Mati</option>
          </SelectInput>
        </Field>
        <Check
          label="Lower Third"
          checked={Boolean(getDeep(config, 'overlay.lowerThirdEnabled', false))}
          onChange={v => updateConfig('overlay.lowerThirdEnabled', v)}
        />
        <Field label="Lower Third Text">
          <TextInput
            value={getDeep(config, 'overlay.lowerThirdText', '')}
            onChange={v => updateConfig('overlay.lowerThirdText', v)}
            placeholder="Judul / nama channel / info lagu"
          />
        </Field>
        <Field label="Posisi">
          <SelectInput
            value={getDeep(config, 'overlay.lowerThirdPosition', 'Bawah')}
            onChange={v => updateConfig('overlay.lowerThirdPosition', v)}
          >
            <option>Bawah</option>
            <option>Tengah</option>
            <option>Atas</option>
          </SelectInput>
        </Field>
        <Field label="Muncul detik">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.lowerThirdAt', 2)}
            onChange={v => updateConfig('overlay.lowerThirdAt', v)}
          />
        </Field>
        <Field label="Durasi">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.lowerThirdDuration', 5)}
            onChange={v => updateConfig('overlay.lowerThirdDuration', v)}
          />
        </Field>
      </Card>

      {/* Efek Sinematik */}
      <Card title="Efek Sinematik">
        <Check
          label="Vignette"
          checked={Boolean(getDeep(config, 'overlay.vignette', false))}
          onChange={v => updateConfig('overlay.vignette', v)}
        />
        <SliderControl
          label="Vignette Strength"
          value={Number(getDeep(config, 'overlay.vignetteStrength', 0.35)) * 100}
          onChange={v => updateConfig('overlay.vignetteStrength', v / 100)}
          min={0}
          max={100}
        />
        <Check
          label="Film Grain"
          checked={Boolean(getDeep(config, 'overlay.filmGrain', false))}
          onChange={v => updateConfig('overlay.filmGrain', v)}
        />
        <SliderControl
          label="Grain Strength"
          value={Number(getDeep(config, 'overlay.grainStrength', 12))}
          onChange={v => updateConfig('overlay.grainStrength', v)}
          min={0}
          max={40}
        />
        <Check
          label="Scanlines"
          checked={Boolean(getDeep(config, 'overlay.scanlines', false))}
          onChange={v => updateConfig('overlay.scanlines', v)}
        />
        <SliderControl
          label="Scanline Opacity"
          value={Number(getDeep(config, 'overlay.scanlineOpacity', 6))}
          onChange={v => updateConfig('overlay.scanlineOpacity', v)}
          min={0}
          max={30}
        />
        <Check
          label="Darken overlay"
          checked={Boolean(getDeep(config, 'overlay.darken', false))}
          onChange={v => updateConfig('overlay.darken', v)}
        />
        <SliderControl
          label="Darken Opacity"
          value={Number(getDeep(config, 'overlay.darkenOpacity', 15))}
          onChange={v => updateConfig('overlay.darkenOpacity', v)}
          min={0}
          max={60}
        />
      </Card>

      {/* Advanced Color Grading */}
      <Card title="Advanced Color Grading">
        <Check
          label="Enable Color Grading"
          checked={Boolean(getDeep(config, 'overlay.colorGrading.enabled', false))}
          onChange={v => updateConfig('overlay.colorGrading.enabled', v)}
        />
        <Field label="LUT Preset">
          <SelectInput
            value={getDeep(config, 'overlay.colorGrading.lutPreset', 'none')}
            onChange={v => updateConfig('overlay.colorGrading.lutPreset', v)}
          >
            <option value="none">None</option>
            <option value="cinematic-warm">Cinematic Warm</option>
            <option value="cinematic-cool">Cinematic Cool</option>
            <option value="vintage">Vintage</option>
            <option value="noir">Film Noir</option>
            <option value="vibrant">Vibrant</option>
            <option value="desaturated">Desaturated</option>
          </SelectInput>
        </Field>
        <Field label="Custom LUT File">
          <PathInput
            value={getDeep(config, 'overlay.colorGrading.lutFile', '')}
            onChange={v => updateConfig('overlay.colorGrading.lutFile', v)}
            placeholder=".cube file"
            filter="lut"
          />
        </Field>
        <Field label="LUT Strength">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.colorGrading.lutStrength', 100)}
            onChange={v => updateConfig('overlay.colorGrading.lutStrength', v)}
            placeholder="0-100"
          />
        </Field>
        <SliderControl
          label="Brightness"
          value={Number(getDeep(config, 'overlay.colorGrading.brightness', 0))}
          onChange={v => updateConfig('overlay.colorGrading.brightness', v)}
          min={-50}
          max={50}
        />
        <SliderControl
          label="Contrast"
          value={Number(getDeep(config, 'overlay.colorGrading.contrast', 0))}
          onChange={v => updateConfig('overlay.colorGrading.contrast', v)}
          min={-50}
          max={50}
        />
        <SliderControl
          label="Saturation"
          value={Number(getDeep(config, 'overlay.colorGrading.saturation', 0))}
          onChange={v => updateConfig('overlay.colorGrading.saturation', v)}
          min={-100}
          max={100}
        />
        <SliderControl
          label="Temperature"
          value={Number(getDeep(config, 'overlay.colorGrading.temperature', 0))}
          onChange={v => updateConfig('overlay.colorGrading.temperature', v)}
          min={-100}
          max={100}
        />
        <SliderControl
          label="Tint"
          value={Number(getDeep(config, 'overlay.colorGrading.tint', 0))}
          onChange={v => updateConfig('overlay.colorGrading.tint', v)}
          min={-100}
          max={100}
        />
        <SliderControl
          label="Vibrance"
          value={Number(getDeep(config, 'overlay.colorGrading.vibrance', 0))}
          onChange={v => updateConfig('overlay.colorGrading.vibrance', v)}
          min={-50}
          max={50}
        />
        <Callout type="tip">
          Color Grading menggunakan LUT (Look-Up Table) untuk color correction profesional. Upload .cube file atau
          gunakan preset.
        </Callout>
      </Card>

      {/* Motion Effects */}
      <Card title="Motion Effects">
        <Check
          label="Enable Motion Blur"
          checked={Boolean(getDeep(config, 'overlay.motionBlur.enabled', false))}
          onChange={v => updateConfig('overlay.motionBlur.enabled', v)}
        />
        <SliderControl
          label="Motion Blur Amount"
          value={Number(getDeep(config, 'overlay.motionBlur.amount', 0.5))}
          onChange={v => updateConfig('overlay.motionBlur.amount', v)}
          min={0}
          max={1}
        />
        <Check
          label="Enable Shake Effect"
          checked={Boolean(getDeep(config, 'overlay.shake.enabled', false))}
          onChange={v => updateConfig('overlay.shake.enabled', v)}
        />
        <Field label="Shake Intensity">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.shake.intensity', 5)}
            onChange={v => updateConfig('overlay.shake.intensity', v)}
            placeholder="1-20"
          />
        </Field>
        <Field label="Shake Frequency">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.shake.frequency', 10)}
            onChange={v => updateConfig('overlay.shake.frequency', v)}
            placeholder="1-30"
          />
        </Field>
        <Field label="Shake Trigger">
          <SelectInput
            value={getDeep(config, 'overlay.shake.trigger', 'beat')}
            onChange={v => updateConfig('overlay.shake.trigger', v)}
          >
            <option value="beat">On Beat</option>
            <option value="drop">On Drop</option>
            <option value="continuous">Continuous</option>
            <option value="manual">Manual Times</option>
          </SelectInput>
        </Field>
        <Check
          label="Enable Zoom Pulse"
          checked={Boolean(getDeep(config, 'overlay.zoomPulse.enabled', false))}
          onChange={v => updateConfig('overlay.zoomPulse.enabled', v)}
        />
        <SliderControl
          label="Zoom Amount"
          value={Number(getDeep(config, 'overlay.zoomPulse.amount', 5))}
          onChange={v => updateConfig('overlay.zoomPulse.amount', v)}
          min={0}
          max={20}
        />
        <Field label="Zoom Sync">
          <SelectInput
            value={getDeep(config, 'overlay.zoomPulse.sync', 'beat')}
            onChange={v => updateConfig('overlay.zoomPulse.sync', v)}
          >
            <option value="beat">Beat</option>
            <option value="bar">Bar</option>
            <option value="phrase">Phrase</option>
          </SelectInput>
        </Field>
      </Card>

      {/* Glitch & Distortion */}
      <Card title="Glitch & Distortion">
        <Check
          label="Enable Glitch Effect"
          checked={Boolean(getDeep(config, 'overlay.glitch.enabled', false))}
          onChange={v => updateConfig('overlay.glitch.enabled', v)}
        />
        <Field label="Glitch Style">
          <SelectInput
            value={getDeep(config, 'overlay.glitch.style', 'digital')}
            onChange={v => updateConfig('overlay.glitch.style', v)}
          >
            <option value="digital">Digital</option>
            <option value="analog">Analog VHS</option>
            <option value="rgb-split">RGB Split</option>
            <option value="scan">Scan Lines</option>
          </SelectInput>
        </Field>
        <Field label="Glitch Intensity">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.glitch.intensity', 30)}
            onChange={v => updateConfig('overlay.glitch.intensity', v)}
            placeholder="0-100"
          />
        </Field>
        <Field label="Glitch Frequency">
          <SelectInput
            value={getDeep(config, 'overlay.glitch.frequency', 'occasional')}
            onChange={v => updateConfig('overlay.glitch.frequency', v)}
          >
            <option value="rare">Rare</option>
            <option value="occasional">Occasional</option>
            <option value="frequent">Frequent</option>
            <option value="constant">Constant</option>
          </SelectInput>
        </Field>
        <Check
          label="Enable Chromatic Aberration"
          checked={Boolean(getDeep(config, 'overlay.chromaticAberration.enabled', false))}
          onChange={v => updateConfig('overlay.chromaticAberration.enabled', v)}
        />
        <SliderControl
          label="Aberration Amount"
          value={Number(getDeep(config, 'overlay.chromaticAberration.amount', 2))}
          onChange={v => updateConfig('overlay.chromaticAberration.amount', v)}
          min={0}
          max={10}
        />
        <Check
          label="Enable Lens Distortion"
          checked={Boolean(getDeep(config, 'overlay.lensDistortion.enabled', false))}
          onChange={v => updateConfig('overlay.lensDistortion.enabled', v)}
        />
        <SliderControl
          label="Distortion Amount"
          value={Number(getDeep(config, 'overlay.lensDistortion.amount', 0))}
          onChange={v => updateConfig('overlay.lensDistortion.amount', v)}
          min={-50}
          max={50}
        />
        <Field label="Distortion Type">
          <SelectInput
            value={getDeep(config, 'overlay.lensDistortion.type', 'barrel')}
            onChange={v => updateConfig('overlay.lensDistortion.type', v)}
          >
            <option value="barrel">Barrel</option>
            <option value="pincushion">Pincushion</option>
            <option value="fisheye">Fisheye</option>
          </SelectInput>
        </Field>
      </Card>

      {/* Frame & Rasio */}
      <Card title="Frame & Rasio">
        <Check
          label="Frame Border"
          checked={Boolean(getDeep(config, 'overlay.frameBorder', false))}
          onChange={v => updateConfig('overlay.frameBorder', v)}
        />
        <Field label="Warna Border">
          <TextInput
            value={getDeep(config, 'overlay.borderColor', 'white')}
            onChange={v => updateConfig('overlay.borderColor', v)}
          />
        </Field>
        <Field label="Ketebalan">
          <TextInput
            type="number"
            value={getDeep(config, 'overlay.borderThickness', 6)}
            onChange={v => updateConfig('overlay.borderThickness', v)}
          />
        </Field>
        <Field label="Warna Glow">
          <TextInput
            value={getDeep(config, 'overlay.glowColor', '#22c55e')}
            onChange={v => updateConfig('overlay.glowColor', v)}
          />
        </Field>
        <Check
          label="Letterbox cinematic"
          checked={Boolean(getDeep(config, 'overlay.letterbox', false))}
          onChange={v => updateConfig('overlay.letterbox', v)}
        />
        <SliderControl
          label="Letterbox Size"
          value={Number(getDeep(config, 'overlay.letterboxSize', 80))}
          onChange={v => updateConfig('overlay.letterboxSize', v)}
          min={0}
          max={180}
        />
      </Card>
    </div>
  );
}
