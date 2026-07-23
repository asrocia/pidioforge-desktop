import { getDeep } from '../../../lib/config-path';
import type { PidioConfig } from '../../../types/app.types';
import { useLyricsEngine } from './hooks';
import { AutoFetchCard } from './AutoFetchCard';
import { TranscriptionCard } from './TranscriptionCard';
import { EngineCard } from './EngineCard';
import { SmartSyncCard } from './SmartSyncCard';
import { MultiLanguageCard } from './MultiLanguageCard';
import { TimingOutputCard } from './TimingOutputCard';
import { StyleCard } from './StyleCard';
import { TimelinePreviewCard } from './TimelinePreviewCard';
import { RealTimePreviewCard } from './RealTimePreviewCard';
import { ExportPreviewCard } from './ExportPreviewCard';

export function LyricsPanel({
  config,
  updateConfig,
}: {
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const engine = useLyricsEngine({ config, updateConfig });
  const previewRows = engine.parsed.slice(0, 6);
  const outputPreview =
    getDeep(config, 'lyrics.exportFormat', 'srt') === 'lrc'
      ? engine.lrc
      : getDeep(config, 'lyrics.exportFormat', 'srt') === 'vtt'
        ? engine.vtt
        : engine.srt;

  return (
    <div className="space-y-4">
      <AutoFetchCard config={config} updateConfig={updateConfig} engine={engine} />
      <TranscriptionCard config={config} updateConfig={updateConfig} engine={engine} />
      <EngineCard config={config} updateConfig={updateConfig} engine={engine} />
      <SmartSyncCard config={config} updateConfig={updateConfig} engine={engine} />
      <MultiLanguageCard config={config} updateConfig={updateConfig} engine={engine} />
      <TimingOutputCard config={config} updateConfig={updateConfig} />
      <StyleCard config={config} updateConfig={updateConfig} engine={engine} />
      <TimelinePreviewCard previewRows={previewRows} />
      <RealTimePreviewCard config={config} updateConfig={updateConfig} engine={engine} previewRows={previewRows} />
      <ExportPreviewCard outputPreview={outputPreview} />
    </div>
  );
}
