import { Field, SelectInput } from '../../ui/form-controls';
import { Check } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, WarningList } from '../../ui/design-system-components';
import type { TargetCardProps } from './types';

export function PlatformPresetsCard({ config, updateConfig }: TargetCardProps) {
  return (
    <Card title="Platform Presets">
      <Field label="Target Platform">
        <SelectInput
          value={getDeep(config, 'target.platform', 'custom')}
          onChange={v => {
            updateConfig('target.platform', v);
            if (v === 'youtube') {
              updateConfig('target.resolution', '1920x1080');
              updateConfig('target.fps', 30);
              updateConfig('target.bitrate', '8M');
              updateConfig('target.quality', 'high');
              updateConfig('target.faststart', true);
            }
            if (v === 'youtube-shorts') {
              updateConfig('target.resolution', '1080x1920');
              updateConfig('target.fps', 30);
              updateConfig('target.bitrate', '6M');
              updateConfig('target.quality', 'balanced');
            }
            if (v === 'tiktok') {
              updateConfig('target.resolution', '1080x1920');
              updateConfig('target.fps', 30);
              updateConfig('target.bitrate', '5M');
              updateConfig('target.quality', 'balanced');
            }
            if (v === 'instagram-feed') {
              updateConfig('target.resolution', '1080x1080');
              updateConfig('target.fps', 30);
              updateConfig('target.bitrate', '5M');
              updateConfig('target.quality', 'balanced');
            }
            if (v === 'instagram-reels') {
              updateConfig('target.resolution', '1080x1920');
              updateConfig('target.fps', 30);
              updateConfig('target.bitrate', '5M');
              updateConfig('target.quality', 'balanced');
            }
            if (v === 'facebook') {
              updateConfig('target.resolution', '1280x720');
              updateConfig('target.fps', 30);
              updateConfig('target.bitrate', '4M');
              updateConfig('target.quality', 'balanced');
            }
          }}
        >
          <option value="custom">Custom</option>
          <option value="youtube">YouTube (1080p Landscape)</option>
          <option value="youtube-shorts">YouTube Shorts (9:16)</option>
          <option value="tiktok">TikTok (9:16)</option>
          <option value="instagram-feed">Instagram Feed (1:1)</option>
          <option value="instagram-reels">Instagram Reels (9:16)</option>
          <option value="facebook">Facebook (720p)</option>
        </SelectInput>
      </Field>
      <WarningList
        tone="info"
        title="Platform Specs"
        items={[
          'YouTube: 1080p, 30fps, 8Mbps, High Quality',
          'Shorts/TikTok: 1080x1920, 30fps, 5-6Mbps',
          'Instagram: 1080x1080 (Feed) or 1080x1920 (Reels)',
          'Facebook: 720p, 30fps, 4Mbps',
        ]}
      />
      <Check
        label="Auto-optimize for selected platform"
        checked={Boolean(getDeep(config, 'target.autoOptimize', true))}
        onChange={v => updateConfig('target.autoOptimize', v)}
      />
    </Card>
  );
}
