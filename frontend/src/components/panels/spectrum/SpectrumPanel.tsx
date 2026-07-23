import type { PidioConfig } from '../../../types/app.types';
import { useSpectrumEngine } from './hooks';
import { PreviewCard } from './PreviewCard';
import { MediaCard } from './MediaCard';
import { VisualizerCard } from './VisualizerCard';
import { ParticlesCard } from './ParticlesCard';
import { ColorsBeatCard } from './ColorsBeatCard';
import { ProgressCard } from './ProgressCard';
import { LogoOverlayCard } from './LogoOverlayCard';
import { NowPlayingCard } from './NowPlayingCard';

export function SpectrumPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const engine = useSpectrumEngine({ config, updateConfig });

  return (
    <div className="space-y-4">
      <PreviewCard config={config} updateConfig={updateConfig} engine={engine} />
      <MediaCard config={config} updateConfig={updateConfig} engine={engine} />
      <VisualizerCard config={config} updateConfig={updateConfig} engine={engine} />
      <ParticlesCard config={config} updateConfig={updateConfig} />
      <ColorsBeatCard config={config} updateConfig={updateConfig} engine={engine} />
      <ProgressCard config={config} updateConfig={updateConfig} />
      <LogoOverlayCard config={config} updateConfig={updateConfig} />
      <NowPlayingCard config={config} updateConfig={updateConfig} engine={engine} />
    </div>
  );
}
