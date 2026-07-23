import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card } from '../../ui/design-system-components';
import { LayerOrderInput } from '../../ui/LayerOrderInput';
import type { BrandingCardProps, BrandingEngineState } from './types';

interface WatermarkLayerCardProps extends BrandingCardProps {
  engine: BrandingEngineState;
}

export function WatermarkLayerCard({ config, updateConfig, engine }: WatermarkLayerCardProps) {
  const { positionOptions } = engine;

  return (
    <Card title="Watermark & Layer">
      <Check
        label="Aktifkan watermark teks"
        checked={Boolean(getDeep(config, 'branding.watermarkEnabled', false))}
        onChange={v => updateConfig('branding.watermarkEnabled', v)}
      />
      <Field label="Teks">
        <TextInput
          value={getDeep(config, 'branding.watermarkText', '')}
          onChange={v => updateConfig('branding.watermarkText', v)}
          placeholder="@channel / brand name"
        />
      </Field>
      <div className="space-y-3">
        <Field label="Posisi">
          <SelectInput
            value={getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah')}
            onChange={v => updateConfig('branding.watermarkPosition', v)}
          >
            {positionOptions}
          </SelectInput>
        </Field>
        <Field label="Opacity">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.watermarkOpacity', 70)}
            onChange={v => updateConfig('branding.watermarkOpacity', v)}
          />
        </Field>
        <Field label="Mode">
          <SelectInput
            value={getDeep(config, 'branding.watermarkMode', 'always')}
            onChange={v => updateConfig('branding.watermarkMode', v)}
          >
            <option value="always">Selalu tampil</option>
            <option value="interval">Muncul interval</option>
          </SelectInput>
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Interval">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.watermarkInterval', 12)}
            onChange={v => updateConfig('branding.watermarkInterval', v)}
          />
        </Field>
        <Field label="Durasi Tampil">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.watermarkVisibleDuration', 5)}
            onChange={v => updateConfig('branding.watermarkVisibleDuration', v)}
          />
        </Field>
        <Field label="Layer Order">
          <LayerOrderInput
            value={getDeep(
              config,
              'branding.layerOrder',
              'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird',
            )}
            onChange={v => updateConfig('branding.layerOrder', v)}
          />
        </Field>
      </div>
    </Card>
  );
}
