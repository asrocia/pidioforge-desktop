import type { PidioConfig } from '../../../types/app.types';
import { useLoopingActions, useLoopingEngine } from './hooks';
import { VideoLoopCard } from './VideoLoopCard';
import { SpeedControlCard } from './SpeedControlCard';
import { TimelineEditorCard } from './TimelineEditorCard';
import { SeamPreviewCard } from './SeamPreviewCard';
import { QualityScoringCard } from './QualityScoringCard';
import { AudioSyncCard } from './AudioSyncCard';
import { ResultCard } from './ResultCard';
import { BatchLoopingCard } from './BatchLoopingCard';

export function LoopingPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const engine = useLoopingEngine({ config, updateConfig });
  const actions = useLoopingActions(engine, config, updateConfig);

  return (
    <div className="space-y-4">
      <VideoLoopCard config={config} updateConfig={updateConfig} engine={engine} actions={actions} />
      <SpeedControlCard config={config} updateConfig={updateConfig} />
      <TimelineEditorCard engine={engine} />
      <SeamPreviewCard engine={engine} />
      <QualityScoringCard engine={engine} />
      <AudioSyncCard config={config} updateConfig={updateConfig} />
      <ResultCard engine={engine} actions={actions} />
      <BatchLoopingCard engine={engine} renderBatch={actions.renderBatch} />
    </div>
  );
}
