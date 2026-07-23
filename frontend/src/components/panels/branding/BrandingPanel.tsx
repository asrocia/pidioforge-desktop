import type { PidioConfig } from '../../../types/app.types';
import { useBrandingEngine } from './hooks';
import { ToolbarCard } from './ToolbarCard';
import { BumperCard } from './BumperCard';
import { LogoCard } from './LogoCard';
import { CtaCard } from './CtaCard';
import { TextOverlayCard } from './TextOverlayCard';
import { SocialBadgesCard } from './SocialBadgesCard';
import { WatermarkLayerCard } from './WatermarkLayerCard';
import { BrandColorsCard } from './BrandColorsCard';
import { TemplatesCard } from './TemplatesCard';

export function BrandingPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const engine = useBrandingEngine({ config, updateConfig });

  return (
    <div className="space-y-4">
      <ToolbarCard config={config} updateConfig={updateConfig} engine={engine} />
      <BumperCard config={config} updateConfig={updateConfig} engine={engine} />
      <LogoCard config={config} updateConfig={updateConfig} engine={engine} />
      <CtaCard config={config} updateConfig={updateConfig} engine={engine} />
      <TextOverlayCard config={config} updateConfig={updateConfig} />
      <SocialBadgesCard config={config} updateConfig={updateConfig} />
      <WatermarkLayerCard config={config} updateConfig={updateConfig} engine={engine} />
      <BrandColorsCard config={config} updateConfig={updateConfig} />
      <TemplatesCard config={config} updateConfig={updateConfig} />
    </div>
  );
}
