import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { SpectrumCardProps, SpectrumEngineState } from './types';

interface VisualizerCardProps extends SpectrumCardProps {
  engine: SpectrumEngineState;
}

export function VisualizerCard({ config, updateConfig, engine }: VisualizerCardProps) {
  const { spY } = engine;

  return (
    <Card title="Visualizer">
      <Check
        label="Spektrum Audio"
        checked={Boolean(getDeep(config, 'spectrum.enabled', true))}
        onChange={v => updateConfig('spectrum.enabled', v)}
      />
      <Field label="Model">
        <SelectInput
          value={getDeep(config, 'spectrum.model', 'Wave')}
          onChange={v => updateConfig('spectrum.model', v)}
        >
          <option>Bar</option>
          <option>Wave</option>
          <option>Line</option>
          <option>Circular</option>
          <option>Radial</option>
          <option>3D Bars</option>
        </SelectInput>
      </Field>
      <Field label="Analisis">
        <SelectInput
          value={getDeep(config, 'spectrum.analyzerMode', 'frequency')}
          onChange={v => updateConfig('spectrum.analyzerMode', v)}
        >
          <option value="frequency">Frekuensi Nyata</option>
          <option value="waveform">Waveform</option>
        </SelectInput>
      </Field>
      <Field label="Posisi">
        <SelectInput
          value={getDeep(config, 'spectrum.position', 'Bawah')}
          onChange={v => updateConfig('spectrum.position', v)}
        >
          <option>Bawah</option>
          <option>Tengah</option>
          <option>Atas</option>
        </SelectInput>
      </Field>
      <Field label="Pantul">
        <SelectInput
          value={getDeep(config, 'spectrum.mirror', 'Off')}
          onChange={v => updateConfig('spectrum.mirror', v)}
        >
          <option value="Off">Mati</option>
          <option value="On">Aktif</option>
          <option value="Mirror">Mirror</option>
        </SelectInput>
      </Field>
      <Field label="Kualitas">
        <SelectInput
          value={getDeep(config, 'spectrum.analyzerQuality', 'balanced')}
          onChange={v => updateConfig('spectrum.analyzerQuality', v)}
        >
          <option value="fast">Cepat</option>
          <option value="balanced">Seimbang</option>
          <option value="high">Tinggi</option>
        </SelectInput>
      </Field>
      <Field label="Auto Tune">
        <SelectInput
          value={getDeep(config, 'spectrum.autoTune', true) ? 'Aktif' : 'Mati'}
          onChange={v => updateConfig('spectrum.autoTune', v === 'Aktif')}
        >
          <option value="Aktif">Aktif</option>
          <option value="Mati">Mati</option>
        </SelectInput>
      </Field>
      <SliderControl
        label="Tinggi Spectrum"
        value={Number(getDeep(config, 'spectrum.height', 128))}
        onChange={v => updateConfig('spectrum.height', v)}
        min={32}
        max={300}
      />
      <SliderControl
        label="Posisi Spectrum"
        value={spY}
        onChange={v => {
          updateConfig('spectrum.previewY', v);
          updateConfig('spectrum.y', v - 50);
          updateConfig('spectrum.position', v < 34 ? 'Atas' : v > 66 ? 'Bawah' : 'Tengah');
        }}
        min={6}
        max={94}
      />
      <SliderControl
        label="Transparansi"
        value={Number(getDeep(config, 'spectrum.transparency', 80))}
        onChange={v => updateConfig('spectrum.transparency', v)}
        min={10}
        max={100}
      />
      <Field label="Lebar">
        <SelectInput
          value={getDeep(config, 'spectrum.widthMode', 'full')}
          onChange={v => updateConfig('spectrum.widthMode', v)}
        >
          <option value="full">Penuh</option>
          <option value="center">Tengah</option>
        </SelectInput>
      </Field>
      <Field label="Jarak X">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.marginX', 0)}
          onChange={v => updateConfig('spectrum.marginX', v)}
        />
      </Field>
      <Field label="Jarak Y">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.marginY', 34)}
          onChange={v => updateConfig('spectrum.marginY', v)}
        />
      </Field>
    </Card>
  );
}
