import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card } from '../../ui/design-system-components';
import type { BrandingCardProps } from './types';

export function SocialBadgesCard({ config, updateConfig }: BrandingCardProps) {
  return (
    <Card title="Social Media Badges">
      <Check
        label="Enable Social Badges"
        checked={Boolean(getDeep(config, 'branding.socialBadges.enabled', false))}
        onChange={v => updateConfig('branding.socialBadges.enabled', v)}
      />
      <div className="space-y-3">
        <Field label="Badge Style">
          <SelectInput
            value={getDeep(config, 'branding.socialBadges.style', 'modern')}
            onChange={v => updateConfig('branding.socialBadges.style', v)}
          >
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
            <option value="classic">Classic</option>
            <option value="neon">Neon</option>
          </SelectInput>
        </Field>
        <Field label="Position">
          <SelectInput
            value={getDeep(config, 'branding.socialBadges.position', 'bottom-left')}
            onChange={v => updateConfig('branding.socialBadges.position', v)}
          >
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </SelectInput>
        </Field>
        <Field label="Layout">
          <SelectInput
            value={getDeep(config, 'branding.socialBadges.layout', 'horizontal')}
            onChange={v => updateConfig('branding.socialBadges.layout', v)}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="stacked">Stacked</option>
          </SelectInput>
        </Field>
      </div>
      <Field label="Instagram Handle">
        <TextInput
          value={getDeep(config, 'branding.socialBadges.instagram', '')}
          onChange={v => updateConfig('branding.socialBadges.instagram', v)}
          placeholder="@username"
        />
      </Field>
      <Field label="TikTok Handle">
        <TextInput
          value={getDeep(config, 'branding.socialBadges.tiktok', '')}
          onChange={v => updateConfig('branding.socialBadges.tiktok', v)}
          placeholder="@username"
        />
      </Field>
      <Field label="YouTube Channel">
        <TextInput
          value={getDeep(config, 'branding.socialBadges.youtube', '')}
          onChange={v => updateConfig('branding.socialBadges.youtube', v)}
          placeholder="@channelname"
        />
      </Field>
      <Field label="Twitter/X Handle">
        <TextInput
          value={getDeep(config, 'branding.socialBadges.twitter', '')}
          onChange={v => updateConfig('branding.socialBadges.twitter', v)}
          placeholder="@username"
        />
      </Field>
      <div className="space-y-3">
        <Field label="Icon Size">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.socialBadges.iconSize', 24)}
            onChange={v => updateConfig('branding.socialBadges.iconSize', v)}
            placeholder="16-48"
          />
        </Field>
        <Field label="Show At (s)">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.socialBadges.showAt', 3)}
            onChange={v => updateConfig('branding.socialBadges.showAt', v)}
          />
        </Field>
        <Field label="Duration (s)">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.socialBadges.duration', 0)}
            onChange={v => updateConfig('branding.socialBadges.duration', v)}
            placeholder="0 = always"
          />
        </Field>
      </div>
      <Check
        label="Animated Icons"
        checked={Boolean(getDeep(config, 'branding.socialBadges.animated', true))}
        onChange={v => updateConfig('branding.socialBadges.animated', v)}
      />
    </Card>
  );
}
