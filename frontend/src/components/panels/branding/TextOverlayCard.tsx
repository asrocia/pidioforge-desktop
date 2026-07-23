import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { BrandingCardProps } from './types';

export function TextOverlayCard({ config, updateConfig }: BrandingCardProps) {
  return (
    <Card title="Animated Text Overlays">
      <Check
        label="Enable Text Overlays"
        checked={Boolean(getDeep(config, 'branding.textOverlay.enabled', false))}
        onChange={v => updateConfig('branding.textOverlay.enabled', v)}
      />
      <div className="space-y-3">
        <Field label="Overlay Type">
          <SelectInput
            value={getDeep(config, 'branding.textOverlay.type', 'lower-third')}
            onChange={v => updateConfig('branding.textOverlay.type', v)}
          >
            <option value="lower-third">Lower Third</option>
            <option value="title">Title</option>
            <option value="caption">Caption</option>
            <option value="banner">Banner</option>
            <option value="corner-tag">Corner Tag</option>
          </SelectInput>
        </Field>
        <Field label="Animation">
          <SelectInput
            value={getDeep(config, 'branding.textOverlay.animation', 'slide-in')}
            onChange={v => updateConfig('branding.textOverlay.animation', v)}
          >
            <option value="slide-in">Slide In</option>
            <option value="fade">Fade</option>
            <option value="typewriter">Typewriter</option>
            <option value="bounce">Bounce</option>
            <option value="zoom">Zoom</option>
          </SelectInput>
        </Field>
        <Field label="Position">
          <SelectInput
            value={getDeep(config, 'branding.textOverlay.position', 'bottom')}
            onChange={v => updateConfig('branding.textOverlay.position', v)}
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="center">Center</option>
          </SelectInput>
        </Field>
      </div>
      <Field label="Primary Text">
        <TextInput
          value={getDeep(config, 'branding.textOverlay.primaryText', '')}
          onChange={v => updateConfig('branding.textOverlay.primaryText', v)}
          placeholder="Main title or name"
        />
      </Field>
      <Field label="Secondary Text">
        <TextInput
          value={getDeep(config, 'branding.textOverlay.secondaryText', '')}
          onChange={v => updateConfig('branding.textOverlay.secondaryText', v)}
          placeholder="Subtitle or description"
        />
      </Field>
      <div className="space-y-3">
        <Field label="Show At (s)">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.textOverlay.showAt', 1)}
            onChange={v => updateConfig('branding.textOverlay.showAt', v)}
          />
        </Field>
        <Field label="Duration (s)">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.textOverlay.duration', 5)}
            onChange={v => updateConfig('branding.textOverlay.duration', v)}
          />
        </Field>
        <Field label="Font Size">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.textOverlay.fontSize', 32)}
            onChange={v => updateConfig('branding.textOverlay.fontSize', v)}
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Background Color">
          <TextInput
            value={getDeep(config, 'branding.textOverlay.bgColor', '#000000')}
            onChange={v => updateConfig('branding.textOverlay.bgColor', v)}
          />
        </Field>
        <Field label="Text Color">
          <TextInput
            value={getDeep(config, 'branding.textOverlay.textColor', '#ffffff')}
            onChange={v => updateConfig('branding.textOverlay.textColor', v)}
          />
        </Field>
      </div>
      <SliderControl
        label="Background Opacity"
        value={Number(getDeep(config, 'branding.textOverlay.bgOpacity', 80))}
        onChange={v => updateConfig('branding.textOverlay.bgOpacity', v)}
        min={0}
        max={100}
      />
    </Card>
  );
}
