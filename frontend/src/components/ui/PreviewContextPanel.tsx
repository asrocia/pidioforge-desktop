import { Field, Check, TextInput, SelectInput } from './form-controls';
import { Card, SliderControl } from './design-system-components';
import { getDeep } from '../../lib/config-path';
import type { PidioConfig } from '../../types/app.types';
import type { LiveTarget } from '../../types/preview.types';

interface PreviewContextPanelProps {
  target: LiveTarget | '';
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}

export function PreviewContextPanel({ target, config, updateConfig }: PreviewContextPanelProps) {
  if (!target) return null;

  return (
    <div style={{ marginTop: '8px' }}>
      {target === 'spectrum' && (
        <Card title="Spectrum">
          <SliderControl
            label="Tinggi"
            value={Number(getDeep(config, 'spectrum.height', 128))}
            onChange={v => updateConfig('spectrum.height', v)}
            min={32}
            max={300}
          />
          <SliderControl
            label="Transparansi"
            value={Number(getDeep(config, 'spectrum.transparency', 80))}
            onChange={v => updateConfig('spectrum.transparency', v)}
            min={10}
            max={100}
          />
          <Field label="Warna 1">
            <TextInput
              value={getDeep(config, 'spectrum.color1', 'white')}
              onChange={v => updateConfig('spectrum.color1', v)}
            />
          </Field>
          <Field label="Warna 2">
            <TextInput
              value={getDeep(config, 'spectrum.color2', '#22c55e')}
              onChange={v => updateConfig('spectrum.color2', v)}
            />
          </Field>
          <Check
            label="Progress Bar"
            checked={Boolean(getDeep(config, 'spectrum.progressBar', true))}
            onChange={v => updateConfig('spectrum.progressBar', v)}
          />
          <Field label="Model">
            <SelectInput
              value={getDeep(config, 'spectrum.model', 'Bar')}
              onChange={v => updateConfig('spectrum.model', v)}
            >
              <option>Bar</option>
              <option>Wave</option>
              <option>Line</option>
            </SelectInput>
          </Field>
        </Card>
      )}

      {target === 'nowPlaying' && (
        <Card title="Now Playing">
          <Field label="Judul">
            <TextInput
              value={getDeep(config, 'input.title', '')}
              onChange={v => updateConfig('input.title', v)}
              placeholder="Judul lagu"
            />
          </Field>
          <SliderControl
            label="Ukuran Font"
            value={Number(getDeep(config, 'spectrum.nowPlayingFontSize', 26))}
            onChange={v => updateConfig('spectrum.nowPlayingFontSize', v)}
            min={12}
            max={60}
            unit="px"
          />
          <Field label="Warna">
            <TextInput
              value={getDeep(config, 'spectrum.nowPlayingColor', '#ffffff')}
              onChange={v => updateConfig('spectrum.nowPlayingColor', v)}
            />
          </Field>
          <Field label="Template">
            <TextInput
              value={getDeep(config, 'spectrum.nowPlayingTemplate', '{title}')}
              onChange={v => updateConfig('spectrum.nowPlayingTemplate', v)}
            />
          </Field>
          <Field label="Posisi">
            <SelectInput
              value={getDeep(config, 'spectrum.nowPlayingPosition', 'Atas')}
              onChange={v => updateConfig('spectrum.nowPlayingPosition', v)}
            >
              <option>Atas</option>
              <option>Tengah</option>
              <option>Bawah</option>
            </SelectInput>
          </Field>
        </Card>
      )}

      {target === 'logo' && (
        <Card title="Logo">
          <SliderControl
            label="Scale"
            value={Number(getDeep(config, 'branding.logoScale', 18))}
            onChange={v => updateConfig('branding.logoScale', v)}
            min={5}
            max={100}
          />
          <SliderControl
            label="Opacity"
            value={Number(getDeep(config, 'branding.logoOpacity', 100))}
            onChange={v => updateConfig('branding.logoOpacity', v)}
            min={0}
            max={100}
          />
          <Field label="Posisi">
            <SelectInput
              value={getDeep(config, 'branding.logoPosition', 'Kanan Atas')}
              onChange={v => updateConfig('branding.logoPosition', v)}
            >
              <option>Kanan Atas</option>
              <option>Kiri Atas</option>
              <option>Kanan Bawah</option>
              <option>Kiri Bawah</option>
              <option>Tengah</option>
            </SelectInput>
          </Field>
          <Field label="Animasi">
            <SelectInput
              value={getDeep(config, 'branding.logoAnimation', 'none')}
              onChange={v => updateConfig('branding.logoAnimation', v)}
            >
              <option value="none">Statis</option>
              <option value="fade">Fade</option>
              <option value="slide-left">Slide kiri</option>
              <option value="pulse">Pulse</option>
            </SelectInput>
          </Field>
        </Card>
      )}

      {target === 'cta' && (
        <Card title="CTA">
          <SliderControl
            label="Scale"
            value={Number(getDeep(config, 'branding.ctaScale', 26))}
            onChange={v => updateConfig('branding.ctaScale', v)}
            min={5}
            max={100}
          />
          <Field label="Posisi">
            <SelectInput
              value={getDeep(config, 'branding.ctaPosition', 'Kanan Bawah')}
              onChange={v => updateConfig('branding.ctaPosition', v)}
            >
              <option>Kanan Atas</option>
              <option>Kiri Atas</option>
              <option>Kanan Bawah</option>
              <option>Kiri Bawah</option>
              <option>Tengah</option>
            </SelectInput>
          </Field>
          <Field label="Muncul (dtk)">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.ctaAt', 2)}
              onChange={v => updateConfig('branding.ctaAt', v)}
            />
          </Field>
          <Field label="Durasi (dtk)">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.ctaDuration', 8)}
              onChange={v => updateConfig('branding.ctaDuration', v)}
            />
          </Field>
        </Card>
      )}

      {target === 'watermark' && (
        <Card title="Watermark">
          <Field label="Teks">
            <TextInput
              value={getDeep(config, 'branding.watermarkText', '')}
              onChange={v => updateConfig('branding.watermarkText', v)}
              placeholder="@channel"
            />
          </Field>
          <SliderControl
            label="Opacity"
            value={Number(getDeep(config, 'branding.watermarkOpacity', 70))}
            onChange={v => updateConfig('branding.watermarkOpacity', v)}
            min={0}
            max={100}
          />
          <Field label="Posisi">
            <SelectInput
              value={getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah')}
              onChange={v => updateConfig('branding.watermarkPosition', v)}
            >
              <option>Kanan Atas</option>
              <option>Kiri Atas</option>
              <option>Kanan Bawah</option>
              <option>Kiri Bawah</option>
              <option>Tengah</option>
            </SelectInput>
          </Field>
          <Field label="Mode">
            <SelectInput
              value={getDeep(config, 'branding.watermarkMode', 'always')}
              onChange={v => updateConfig('branding.watermarkMode', v)}
            >
              <option value="always">Selalu</option>
              <option value="interval">Interval</option>
            </SelectInput>
          </Field>
        </Card>
      )}

      {target === 'timestamp' && (
        <Card title="Timestamp">
          <Field label="Teks">
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
        </Card>
      )}

      {target === 'lowerThird' && (
        <Card title="Lower Third">
          <Field label="Teks">
            <TextInput
              value={getDeep(config, 'overlay.lowerThirdText', '')}
              onChange={v => updateConfig('overlay.lowerThirdText', v)}
              placeholder="Judul / info"
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
          <Field label="Muncul (dtk)">
            <TextInput
              type="number"
              value={getDeep(config, 'overlay.lowerThirdAt', 2)}
              onChange={v => updateConfig('overlay.lowerThirdAt', v)}
            />
          </Field>
          <Field label="Durasi (dtk)">
            <TextInput
              type="number"
              value={getDeep(config, 'overlay.lowerThirdDuration', 5)}
              onChange={v => updateConfig('overlay.lowerThirdDuration', v)}
            />
          </Field>
        </Card>
      )}

      {target === 'lyrics' && (
        <Card title="Lirik">
          <Field label="File">
            <TextInput
              value={getDeep(config, 'lyrics.file', '')}
              onChange={v => updateConfig('lyrics.file', v)}
              placeholder="Path file lirik"
            />
          </Field>
          <Field label="Posisi">
            <SelectInput
              value={getDeep(config, 'lyrics.position', 'Bawah')}
              onChange={v => updateConfig('lyrics.position', v)}
            >
              <option>Bawah</option>
              <option>Tengah</option>
              <option>Atas</option>
            </SelectInput>
          </Field>
          <SliderControl
            label="Ukuran Font"
            value={Number(getDeep(config, 'lyrics.scale', 28))}
            onChange={v => updateConfig('lyrics.scale', v)}
            min={12}
            max={72}
            unit="px"
          />
          <Field label="Warna">
            <TextInput
              value={getDeep(config, 'lyrics.color', '#ffffff')}
              onChange={v => updateConfig('lyrics.color', v)}
            />
          </Field>
        </Card>
      )}
    </div>
  );
}
