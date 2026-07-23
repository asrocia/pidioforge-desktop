import type { PidioConfig } from '../../../types/app.types';
import { useAudioAnalysis, useAudioPreview, useStemDrag, useStemManagement } from './hooks';
import { AudioStatsCard } from './AudioStatsCard';
import { PresetCard } from './PresetCard';
import { VolumeCard } from './VolumeCard';
import { SyncFormatCard } from './SyncFormatCard';
import { EqCard } from './EqCard';
import { ReverbDelayCard } from './ReverbDelayCard';
import { AmbientVoiceCard } from './AmbientVoiceCard';
import { BeatReactiveCard } from './BeatReactiveCard';
import { PlaylistStemsCard } from './PlaylistStemsCard';
import { ExportCard } from './ExportCard';

export function AudioMixingPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const analysisState = useAudioAnalysis({ config, updateConfig });
  const previewState = useAudioPreview({ config, updateConfig });
  const stemDrag = useStemDrag({ config, updateConfig });
  const stemManagement = useStemManagement({ config, updateConfig });

  return (
    <div className="space-y-4">
      <AudioStatsCard
        config={config}
        updateConfig={updateConfig}
        analysis={analysisState.analysis}
        validation={analysisState.validation}
      />
      <PresetCard
        config={config}
        updateConfig={updateConfig}
        analysis={analysisState.analysis}
        validation={analysisState.validation}
        message={analysisState.message}
        busy={analysisState.busy}
        previewUrl={previewState.previewUrl}
        previewing={previewState.previewing}
        validateAudio={analysisState.validateAudio}
        analyzeAudio={analysisState.analyzeAudio}
        previewAudio={previewState.previewAudio}
        applyPreset={stemManagement.applyPreset}
      />
      <VolumeCard config={config} updateConfig={updateConfig} />
      <SyncFormatCard config={config} updateConfig={updateConfig} />
      <EqCard config={config} updateConfig={updateConfig} />
      <ReverbDelayCard config={config} updateConfig={updateConfig} />
      <AmbientVoiceCard config={config} updateConfig={updateConfig} />
      <BeatReactiveCard config={config} updateConfig={updateConfig} />
      <PlaylistStemsCard
        config={config}
        updateConfig={updateConfig}
        stemManagement={stemManagement}
        stemDrag={stemDrag}
      />
      <ExportCard config={config} updateConfig={updateConfig} />
    </div>
  );
}
